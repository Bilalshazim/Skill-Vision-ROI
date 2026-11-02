/* Archivio .zip con un solo file non compresso (metodo «stored»), senza dipendenze. */

const CRCT=(function(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();

export function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRCT[(c^u8[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}

/* restituisce le parti binarie dell'archivio, da passare a new Blob(parts) */
export function zipParts(name,text){
  const enc=new TextEncoder(), nm=enc.encode(name), u8=enc.encode(text);
  const crc=crc32(u8), sz=u8.length;
  const lh=new DataView(new ArrayBuffer(30));
  lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true); lh.setUint32(14,crc,true);
  lh.setUint32(18,sz,true); lh.setUint32(22,sz,true); lh.setUint16(26,nm.length,true);
  const cd=new DataView(new ArrayBuffer(46));
  cd.setUint32(0,0x02014b50,true); cd.setUint16(4,20,true); cd.setUint16(6,20,true); cd.setUint16(8,0x0800,true);
  cd.setUint32(16,crc,true); cd.setUint32(20,sz,true); cd.setUint32(24,sz,true);
  cd.setUint16(28,nm.length,true); cd.setUint32(42,0,true);
  const eo=new DataView(new ArrayBuffer(22));
  eo.setUint32(0,0x06054b50,true); eo.setUint16(8,1,true); eo.setUint16(10,1,true);
  eo.setUint32(12,46+nm.length,true); eo.setUint32(16,30+nm.length+sz,true);
  return [new Uint8Array(lh.buffer),nm,u8,new Uint8Array(cd.buffer),nm,new Uint8Array(eo.buffer)];
}
