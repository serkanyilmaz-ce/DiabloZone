using System.Buffers.Binary;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WiseOwl.Casc.Diablo4;

// Read-only CASC extraction. The reviewed upstream opens archives with FileAccess.Read.
if(args.Length!=3&&args.Length!=4)throw new ArgumentException("install-directory requests.json output-directory [strings]");
var install=Path.GetFullPath(args[0]);var output=Path.GetFullPath(args[2]);
if(output.Equals(install,StringComparison.OrdinalIgnoreCase)||output.StartsWith(install+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new ArgumentException("Output must be outside the game installation");
var info=Path.Combine(install,".build.info");var before=SHA256.HashData(File.ReadAllBytes(info));
if(args.Length==4&&args[3]=="strings"){
    Directory.CreateDirectory(output);
    var requests=JsonSerializer.Deserialize<StringRequest[]>(File.ReadAllText(args[1]))!;
    using var storage=Diablo4Storage.Open(install);
    var english=storage.GetStrings("enUS");var turkish=storage.GetStrings("trTR");
    var translations=new List<object>();
    foreach(var request in requests){
        var en=english.Table(request.TableSno);var tr=turkish.Table(request.TableSno);
        foreach(var label in request.Labels){
            var enEntry=en?.Entries.FirstOrDefault(e=>e.Key.Equals(label,StringComparison.OrdinalIgnoreCase));
            var trEntry=tr?.Entries.FirstOrDefault(e=>e.Key.Equals(label,StringComparison.OrdinalIgnoreCase));
            if(enEntry?.Value!=null&&trEntry?.Value!=null)
                translations.Add(new {key=request.Key,tableSno=request.TableSno,label,en=enEntry.Value.Value,tr=trEntry.Value.Value});
        }
    }
    var after=SHA256.HashData(File.ReadAllBytes(info));if(!before.SequenceEqual(after))throw new InvalidOperationException("Game manifest changed during read");
    File.WriteAllText(Path.Combine(output,"strings.json"),JsonSerializer.Serialize(new {source="local-read-only-CASC",sourceVersion=storage.Casc.Build.Version,buildInfoSha256=Convert.ToHexString(before).ToLowerInvariant(),extractorCommit="bb6f084a6f5480b91197f8cc8ad3c022dbf4f821",locales=new[]{"enUS","trTR"},requested=requests.Length,translations},new JsonSerializerOptions{WriteIndented=true}));
    Console.WriteLine($"{translations.Count} official localized strings read; game manifest unchanged.");return;
}
var handles=JsonSerializer.Deserialize<uint[]>(File.ReadAllText(args[1]))!.Distinct().Order().ToArray();
Directory.CreateDirectory(output);
using var d4=Diablo4Storage.Open(install);
var cat=d4.Catalog;var rows=new List<object>();
// Group requests by atlas: decoding once avoids reading a large atlas for every frame.
var groups=new Dictionary<int,List<(uint Handle,TexFrame Frame,string Name)>>();
foreach(var handle in handles){
    if(!cat.TryResolveFrame(handle,out var atlas,out var frame)){rows.Add(new {handle,status="unresolved"});continue;}
    if(!groups.TryGetValue(atlas.Sno,out var list))groups[atlas.Sno]=list=[];
    list.Add((handle,frame,atlas.Name));
}
foreach(var (sno,list) in groups){
    try{
        if(!d4.TextureMeta.TryGet(sno,out var td))throw new InvalidDataException("Missing texture metadata");
        var payload=d4.ReadSno(SnoGroup.Texture,sno,SnoFolder.Payload);
        var payloadHash=Convert.ToHexString(SHA256.HashData(payload)).ToLowerInvariant();
        var atlas=td.DecodeMip0(payload);
        foreach(var entry in list){
            var rect=entry.Frame.PixelRect(td.Width,td.Height);
            var image=new DecodedImage(rect.Width,rect.Height,atlas.Crop(rect.X,rect.Y,rect.Width,rect.Height));
            var filename=$"{entry.Handle}.png";var bytes=Png(image);File.WriteAllBytes(Path.Combine(output,filename),bytes);
            rows.Add(new {handle=entry.Handle,status="extracted",file=filename,width=image.Width,height=image.Height,atlasSno=sno,atlasName=entry.Name,codec=td.Codec.ToString(),payloadSha256=payloadHash,
                frame=new {x=rect.X,y=rect.Y,width=rect.Width,height=rect.Height,u0=entry.Frame.U0,v0=entry.Frame.V0,u1=entry.Frame.U1,v1=entry.Frame.V1},sha256=Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant()});
        }
        Console.WriteLine($"Atlas {sno}: {list.Count} original frames extracted");
    }catch(Exception e) when(e is NotSupportedException or IOException or FormatException or ArgumentException or WiseOwl.Casc.CascException){
        foreach(var entry in list)rows.Add(new {handle=entry.Handle,status="unavailable",atlasSno=sno,atlasName=entry.Name,reason=e.GetType().Name});
    }
}
if(!before.SequenceEqual(SHA256.HashData(File.ReadAllBytes(info))))throw new InvalidOperationException("Game build manifest changed during extraction");
File.WriteAllText(Path.Combine(output,"report.json"),JsonSerializer.Serialize(new {source="local-read-only-CASC",sourceVersion=d4.Casc.Build.Version,buildInfoSha256=Convert.ToHexString(before).ToLowerInvariant(),extractor="WiseOwl.Casc",extractorCommit="bb6f084a6f5480b91197f8cc8ad3c022dbf4f821",generatedAt=DateTimeOffset.UtcNow,requested=handles.Length,assets=rows},new JsonSerializerOptions {WriteIndented=true}));
Console.WriteLine($"{handles.Length} handles inspected; report saved. Game manifest unchanged.");

static byte[] Png(DecodedImage image){
    using var file=new MemoryStream();file.Write(new byte[]{137,80,78,71,13,10,26,10});
    var header=new byte[13];BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(0,4),image.Width);BinaryPrimitives.WriteInt32BigEndian(header.AsSpan(4,4),image.Height);header[8]=8;header[9]=6;Chunk(file,"IHDR",header);
    using var packed=new MemoryStream();using(var z=new ZLibStream(packed,CompressionLevel.Optimal,true)){for(var y=0;y<image.Height;y++){z.WriteByte(0);z.Write(image.Rgba,y*image.Width*4,image.Width*4);}}
    Chunk(file,"IDAT",packed.ToArray());Chunk(file,"IEND",[]);return file.ToArray();
}
static void Chunk(Stream file,string type,byte[] data){
    var tag=Encoding.ASCII.GetBytes(type);Span<byte> size=stackalloc byte[4];BinaryPrimitives.WriteInt32BigEndian(size,data.Length);file.Write(size);file.Write(tag);file.Write(data);
    uint crc=0xFFFFFFFF;foreach(var b in tag.Concat(data)){crc^=b;for(var i=0;i<8;i++)crc=(crc&1)==1?(crc>>1)^0xEDB88320:crc>>1;}
    BinaryPrimitives.WriteUInt32BigEndian(size,~crc);file.Write(size);
}
record StringRequest(string Key,int TableSno,string[] Labels);
