export interface EmployerDocParsed {
  ten: string;
  ma_so_thue: string;
  ma_so_hkd: string;
  cccd: string;
  nguoi_dai_dien: string;
  dia_chi: string;
  raw: string;
}

export function parseEmployerDoc(
  text: string,
  loai: "ca_nhan" | "ho_kinh_doanh" | "doanh_nghiep"
): EmployerDocParsed {
  const data: EmployerDocParsed = {
    ten: "",
    ma_so_thue: "",
    ma_so_hkd: "",
    cccd: "",
    nguoi_dai_dien: "",
    dia_chi: "",
    raw: text,
  };

  const normalized = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1);

  // ============ CÁ NHÂN ============
  if (loai === "ca_nhan") {
    const cccdM = normalized.match(/\b(\d{12})\b/);
    if (cccdM) data.cccd = cccdM[1];

    const nameM = normalized.match(
      /(?:họ\s*và\s*tên|họ\s*tên|full\s*name)[\s:.\-|]*([A-ZÀ-Ỹ][^\n|:]{2,50})/iu
    );
    if (nameM) {
      data.ten = nameM[1].trim().replace(/\s+/g, " ");
      data.nguoi_dai_dien = data.ten;
    }

    const addrM = normalized.match(
      /(?:địa\s*chỉ|thường\s*trú|nơi\s*ở)[\s:.\-|]*([^\n|]{5,120})/iu
    );
    if (addrM) data.dia_chi = addrM[1].trim();
  }

  // ============ DOANH NGHIỆP ============
  if (loai === "doanh_nghiep") {
    const mstM = normalized.match(
      /(?:mã\s*số\s*thuế|mst|tax\s*code)[\s:.\-|]*(\d{10}(?:[\-\s]\d{3})?)/iu
    );
    if (mstM) {
      data.ma_so_thue = mstM[1].replace(/[\s\-]/g, "");
    } else {
      const m = normalized.match(/\b(\d{10,13})\b/);
      if (m) data.ma_so_thue = m[1];
    }

    for (const line of lines) {
      if (
        /(công\s*ty|tnhh|cổ\s*phần|doanh\s*nghiệp|cp\s|jsc)/iu.test(line) &&
        line.length < 200
      ) {
        data.ten = line.replace(/^[|:.\-©®"'>\s]+/g, "").trim();
        break;
      }
    }

    const daiDienM = normalized.match(
      /(?:người\s*đại\s*diện|đại\s*diện|giám\s*đốc)[\s:.\-|]*([A-ZÀ-Ỹ][^\n|:]{2,50})/iu
    );
    if (daiDienM) data.nguoi_dai_dien = daiDienM[1].trim();

    const addrM = normalized.match(
      /(?:địa\s*chỉ|trụ\s*sở)[\s:.\-|]*([^\n|]{5,150})/iu
    );
    if (addrM) data.dia_chi = addrM[1].trim();
  }

  // ============ HỘ KINH DOANH ============
  if (loai === "ho_kinh_doanh") {
    const hkdM = normalized.match(
      /(?:mã\s*số\s*hộ\s*kinh\s*doanh|mã\s*số\s*hkd|số\s*đăng\s*ký)[\s:.\-|]*([A-Z0-9\-\s]{6,25})/iu
    );
    if (hkdM) {
      data.ma_so_hkd = hkdM[1].replace(/\s/g, "").toUpperCase();
    } else {
      const m = normalized.match(/\b([0-9]{2}[A-Z]?[0-9]{6,10})\b/);
      if (m) data.ma_so_hkd = m[1];
    }

    for (const line of lines) {
      if (
        /(hộ\s*kinh\s*doanh|hkd|hộ\s*kd)/iu.test(line) &&
        line.length < 150
      ) {
        data.ten = line.replace(/^[|:.\-©®"'>\s]+/g, "").trim();
        break;
      }
    }

    const daiDienM = normalized.match(
      /(?:chủ\s*hộ|người\s*đại\s*diện|họ\s*và\s*tên)[\s:.\-|]*([A-ZÀ-Ỹ][^\n|:]{2,50})/iu
    );
    if (daiDienM) data.nguoi_dai_dien = daiDienM[1].trim();

    const addrM = normalized.match(
      /(?:địa\s*chỉ|trụ\s*sở)[\s:.\-|]*([^\n|]{5,150})/iu
    );
    if (addrM) data.dia_chi = addrM[1].trim();
  }

  return data;
}