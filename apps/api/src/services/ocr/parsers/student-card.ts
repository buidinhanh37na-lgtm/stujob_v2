export interface StudentCardParsed {
  ma_sinh_vien: string;
  ho_ten: string;
  truong: string;
  khoa: string;
  ngay_sinh: string;
  lop: string;
  raw: string;
}

export function parseStudentCard(text: string): StudentCardParsed {
  const data: StudentCardParsed = {
    ma_sinh_vien: "",
    ho_ten: "",
    truong: "",
    khoa: "",
    ngay_sinh: "",
    lop: "",
    raw: text,
  };

  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // 1. MSSV
  const mssvRe =
    /(?:mã\s*sinh\s*viên|mssv|msv|mã\s*sv|mã\s*số|student\s*id|student\s*code)[\s:.\-|]*([A-Z0-9][A-Z0-9.\-]{5,14})/iu;
  const mssvM = normalized.match(mssvRe);
  if (mssvM) {
    data.ma_sinh_vien = mssvM[1].replace(/[^A-Z0-9]/gi, "").toUpperCase();
  } else {
    const candidates: Array<{ value: string; idx: number }> = [];
    for (let i = 0; i < lines.length; i++) {
      const cleaned = lines[i].replace(/[^0-9A-Z]/gi, "");
      if (/^[0-9]{7,12}$/.test(cleaned)) {
        candidates.push({ value: cleaned, idx: i });
      } else if (/^[A-Z]{2,4}[0-9]{5,10}$/.test(cleaned)) {
        candidates.push({ value: cleaned, idx: i });
      }
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) =>
        b.idx !== a.idx ? b.idx - a.idx : b.value.length - a.value.length
      );
      data.ma_sinh_vien = candidates[0].value;
    }
  }

  // 2. Họ tên
  for (const line of lines) {
    if (/(họ|ho|name)[\s\S]{0,5}(và|va|tên|ten)|hovaten|hoten/i.test(line)) {
      const m = line.match(/[:]\s*([^\n|:]{3,50})/);
      if (m) {
        const cand = m[1].trim().replace(/\s+/g, " ");
        const words = cand.split(" ").filter((w) => w.length >= 2);
        if (
          words.length >= 2 &&
          words.length <= 5 &&
          words.every((w) => /^\p{L}[\p{L}\p{M}]*$/u.test(w))
        ) {
          data.ho_ten = words.join(" ");
          break;
        }
      }
    }
  }

  if (!data.ho_ten) {
    const excludeRe =
      /trường|đại\s*học|cao\s*đẳng|học\s*viện|thẻ\s*sinh|bộ\s|khoa\s*học|chứng\s*nhận|university|college|institute|sinh\s*viên|ngành|khóa|bậc|lớp|xã\s*hội|lao\s*động|thương\s*binh/i;
    for (const line of lines) {
      if (excludeRe.test(line)) continue;
      const clean = line
        .replace(/[|:.\-©®"'>]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const words = clean.split(" ").filter((w) => w.length >= 2);
      if (words.length >= 2 && words.length <= 5) {
        const allUpper = words.every((w) => /^\p{Lu}[\p{Lu}\p{M}]*$/u.test(w));
        if (allUpper) {
          data.ho_ten = words.join(" ");
          break;
        }
      }
    }
  }

  // 3. Trường
  const excludeSchoolRe =
    /bậc|ngành|khóa|hệ\s|sinh\s*viên|thẻ\s*sinh|lớp\s|chứng\s*nhận|xã\s*hội|lao\s*động|thương\s*binh/i;
  for (const line of lines) {
    if (excludeSchoolRe.test(line)) continue;
    if (
      /(trường|đại\s*học|cao\s*đẳng|học\s*viện|university|college|institute)/iu.test(
        line
      ) &&
      line.length >= 10 &&
      line.length <= 150
    ) {
      let clean = line;
      const idx = clean.search(
        /(trường|đại\s*học|cao\s*đẳng|học\s*viện|university|college|institute)/iu
      );
      if (idx > 0) clean = clean.substring(idx);
      clean = clean
        .replace(/[\s"',;:.\-|>\]\)©®\[\]\(]+$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (clean.length >= 10) {
        data.truong = clean;
        break;
      }
    }
  }

  // 4. Ngày sinh
  const dobM = normalized.match(
    /(?:ngày\s*sinh|ngay\s*sinh|dob|date\s*of\s*birth)[\s:.\-|]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/iu
  );
  if (dobM) data.ngay_sinh = dobM[1];

  // 5. Khoa
  for (const line of lines) {
    if (/khóa/i.test(line)) continue;
    const m = line.match(/(?:^|\s)khoa\s*[:\-|.]?\s*([^\n|]{3,60})/iu);
    if (m) {
      data.khoa = m[1].trim();
      break;
    }
  }

  // 6. Lớp
  const lopM = normalized.match(/(?:lớp|class)\s*[:\-|.]?\s*([A-Z0-9]{2,20})/i);
  if (lopM) data.lop = lopM[1].trim();

  return data;
}