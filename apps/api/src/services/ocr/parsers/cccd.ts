export interface CCCDParsed {
  cccd: string;
  ho_ten: string;
  ngay_sinh: string;
  gioi_tinh: string;
  dia_chi: string;
  raw: string;
}

export function parseCCCD(text: string): CCCDParsed {
  const data: CCCDParsed = {
    cccd: "",
    ho_ten: "",
    ngay_sinh: "",
    gioi_tinh: "",
    dia_chi: "",
    raw: text,
  };

  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // Số CCCD
  const cccdM = normalized.match(/\b(\d{12})\b/);
  if (cccdM) data.cccd = cccdM[1];

  // Họ tên
  const nameM = normalized.match(
    /(?:họ\s*và\s*tên|họ\s*tên|full\s*name)[\s:.\-|]*([A-ZÀ-Ỹ][^\n|:]{2,50})/iu
  );
  if (nameM) {
    data.ho_ten = nameM[1].trim().replace(/\s+/g, " ");
  } else {
    for (const line of lines) {
      if (/\d/.test(line)) continue;
      const words = line.split(" ").filter((w) => w.length >= 2);
      if (words.length >= 2 && words.length <= 5) {
        const allUpper = words.every((w) => /^\p{Lu}[\p{Lu}\p{M}]*$/u.test(w));
        if (allUpper) {
          data.ho_ten = words.join(" ");
          break;
        }
      }
    }
  }

  // Ngày sinh
  const dobM = normalized.match(
    /(?:ngày\s*sinh|sinh\s*ngày|date\s*of\s*birth)[\s:.\-|]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/iu
  );
  if (dobM) data.ngay_sinh = dobM[1];

  // Giới tính
  if (/nam/i.test(normalized)) data.gioi_tinh = "Nam";
  else if (/nữ|nu/i.test(normalized)) data.gioi_tinh = "Nữ";

  // Địa chỉ
  const addrM = normalized.match(
    /(?:địa\s*chỉ|thường\s*trú|nơi\s*thường\s*trú|place\s*of\s*residence)[\s:.\-|]*([^\n|]{5,150})/iu
  );
  if (addrM) data.dia_chi = addrM[1].trim();

  return data;
}