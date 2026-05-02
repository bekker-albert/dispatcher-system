export type ZipTextEntry = {
  name: string;
  content: string;
};

export type ZipTextReadOptions = {
  include?: (name: string) => boolean;
};

const zipCrcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  bytes.forEach((byte) => {
    crc = zipCrcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });

  return (crc ^ 0xffffffff) >>> 0;
}

function appendUint16(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff);
}

function appendUint32(target: number[], value: number) {
  target.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
}

function appendBytes(target: number[], bytes: Uint8Array) {
  bytes.forEach((byte) => target.push(byte));
}

export function createZipBlob(entries: ZipTextEntry[]) {
  const encoder = new TextEncoder();
  const fileBytes: number[] = [];
  const centralDirectory: number[] = [];

  entries.forEach((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const contentBytes = encoder.encode(entry.content);
    const checksum = crc32(contentBytes);
    const offset = fileBytes.length;

    appendUint32(fileBytes, 0x04034b50);
    appendUint16(fileBytes, 20);
    appendUint16(fileBytes, 0x0800);
    appendUint16(fileBytes, 0);
    appendUint16(fileBytes, 0);
    appendUint16(fileBytes, 0);
    appendUint32(fileBytes, checksum);
    appendUint32(fileBytes, contentBytes.length);
    appendUint32(fileBytes, contentBytes.length);
    appendUint16(fileBytes, nameBytes.length);
    appendUint16(fileBytes, 0);
    appendBytes(fileBytes, nameBytes);
    appendBytes(fileBytes, contentBytes);

    appendUint32(centralDirectory, 0x02014b50);
    appendUint16(centralDirectory, 20);
    appendUint16(centralDirectory, 20);
    appendUint16(centralDirectory, 0x0800);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint32(centralDirectory, checksum);
    appendUint32(centralDirectory, contentBytes.length);
    appendUint32(centralDirectory, contentBytes.length);
    appendUint16(centralDirectory, nameBytes.length);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint16(centralDirectory, 0);
    appendUint32(centralDirectory, 0);
    appendUint32(centralDirectory, offset);
    appendBytes(centralDirectory, nameBytes);
  });

  const centralDirectoryOffset = fileBytes.length;
  const centralDirectorySize = centralDirectory.length;

  appendBytes(fileBytes, new Uint8Array(centralDirectory));
  appendUint32(fileBytes, 0x06054b50);
  appendUint16(fileBytes, 0);
  appendUint16(fileBytes, 0);
  appendUint16(fileBytes, entries.length);
  appendUint16(fileBytes, entries.length);
  appendUint32(fileBytes, centralDirectorySize);
  appendUint32(fileBytes, centralDirectoryOffset);
  appendUint16(fileBytes, 0);

  return new Blob([new Uint8Array(fileBytes)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function zipReadUint16(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function zipReadUint32(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

async function inflateZipEntry(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readZipTextEntries(file: File, options: ZipTextReadOptions = {}) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoder = new TextDecoder("utf-8");
  let eocdOffset = -1;

  for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 66000); offset -= 1) {
    if (zipReadUint32(bytes, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset < 0) throw new Error("Не удалось прочитать структуру Excel-файла.");

  const entryCount = zipReadUint16(bytes, eocdOffset + 10);
  let directoryOffset = zipReadUint32(bytes, eocdOffset + 16);
  const entries: Record<string, string> = {};

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (zipReadUint32(bytes, directoryOffset) !== 0x02014b50) throw new Error("Excel-файл поврежден.");

    const method = zipReadUint16(bytes, directoryOffset + 10);
    const compressedSize = zipReadUint32(bytes, directoryOffset + 20);
    const fileNameLength = zipReadUint16(bytes, directoryOffset + 28);
    const extraLength = zipReadUint16(bytes, directoryOffset + 30);
    const commentLength = zipReadUint16(bytes, directoryOffset + 32);
    const localHeaderOffset = zipReadUint32(bytes, directoryOffset + 42);
    const fileName = decoder.decode(bytes.slice(directoryOffset + 46, directoryOffset + 46 + fileNameLength)).replace(/\\/g, "/");
    const localNameLength = zipReadUint16(bytes, localHeaderOffset + 26);
    const localExtraLength = zipReadUint16(bytes, localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;

    if (!options.include || options.include(fileName)) {
      const compressedData = bytes.subarray(dataOffset, dataOffset + compressedSize);
      const contentBytes = method === 0 ? compressedData : method === 8 ? await inflateZipEntry(compressedData) : null;

      if (contentBytes) entries[fileName] = decoder.decode(contentBytes);
    }
    directoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}
