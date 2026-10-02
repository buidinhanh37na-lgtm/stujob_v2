/* ============================================================
   OCR Module — Dùng Tesseract.js
   Quét ảnh thẻ sinh viên / chứng chỉ → trích xuất text → parse
   ============================================================ */

const OCR = {

  // ============ QUÉT ẢNH ============
  async scan(file, onProgress) {
    if (!window.Tesseract) throw new Error('Tesseract chưa load');

    // ---- Bước 1: Tiền xử lý ảnh ----
    if (onProgress) onProgress(5);
    const processedFile = await this.preprocessImage(file);
    if (onProgress) onProgress(15);

    // ---- Bước 2: OCR ----
    const result = await Tesseract.recognize(processedFile, 'vie+eng', {
      logger: m => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(15 + Math.round(m.progress * 85));
        }
      },
      tessedit_pageseg_mode: '4',
      preserve_interword_spaces: '1'
    });

    const raw = result.data.text || '';
    return { raw, parsed: this.parseTheSinhVien(raw) };
  },

  // ============ TIỀN XỬ LÝ ẢNH (Otsu binarization) ============
  async preprocessImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MIN_W = 2000;
        const scale = img.width < MIN_W ? MIN_W / img.width : 1.5;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Grayscale + histogram
        const gray = new Uint8Array(w * h);
        const histogram = new Array(256).fill(0);
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const g = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          gray[j] = g;
          histogram[g]++;
        }

        // Otsu threshold
        const total = w * h;
        let sum = 0;
        for (let i = 0; i < 256; i++) sum += i * histogram[i];
        let sumB = 0, wB = 0, max = 0, threshold = 128;
        for (let i = 0; i < 256; i++) {
          wB += histogram[i];
          if (wB === 0) continue;
          const wF = total - wB;
          if (wF === 0) break;
          sumB += i * histogram[i];
          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const between = wB * wF * (mB - mF) ** 2;
          if (between > max) { max = between; threshold = i; }
        }

        // Binarize
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
          const v = gray[j] > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = v;
        }
        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(blob => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, 'image/png', 0.95);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  },

  // ============ PARSE THẺ SINH VIÊN ============
  parseTheSinhVien(text) {
    const data = {
      ma_sinh_vien: '',
      ho_ten: '',
      truong: '',
      khoa: '',
      ngay_sinh: '',
      lop: '',
      raw: text
    };

    const normalized = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 1);

    // ---------- 1. MÃ SINH VIÊN ----------
    // Ưu tiên 1: dòng có context "Mã sinh viên" / "MSSV"
    const mssvContextRe = /(?:mã\s*sinh\s*viên|mssv|msv|mã\s*sv|mã\s*số|student\s*id|student\s*code)[\s:.\-|]*([A-Z0-9][A-Z0-9.\-]{5,14})/iu;
    const mssvMatch = normalized.match(mssvContextRe);

    if (mssvMatch) {
      data.ma_sinh_vien = mssvMatch[1].replace(/[^A-Z0-9]/gi, '').toUpperCase();
    } else {
      // Ưu tiên 2: chọn dòng CUỐI CÙNG có dạng số thuần (thẻ SV VN in MSSV ở đáy thẻ)
      const candidates = [];
      for (let i = 0; i < lines.length; i++) {
        const cleaned = lines[i].replace(/[^0-9A-Z]/gi, '');
        if (/^[0-9]{7,12}$/.test(cleaned)) {
          candidates.push({ value: cleaned, idx: i });
        } else if (/^[A-Z]{2,4}[0-9]{5,10}$/.test(cleaned)) {
          candidates.push({ value: cleaned, idx: i });
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          if (b.idx !== a.idx) return b.idx - a.idx;
          return b.value.length - a.value.length;
        });
        data.ma_sinh_vien = candidates[0].value;
      }
    }

    // ---------- 2. HỌ VÀ TÊN ----------
    // Cho phép "Họvàtên", "Họ và tên", "Họ tên"
    // ---------- 2. HỌ VÀ TÊN ----------
    // Cách 1: dòng có "tên" / "hovaten" / "name" → lấy phần sau dấu ":"
    const nameLines = normalized.split(/\n/);
    for (const line of nameLines) {
      if (/(họ|ho|name)[\s\S]{0,5}(và|va|tên|ten)|hovaten|hoten/i.test(line)) {
        const m = line.match(/[:]\s*([^\n|:]{3,50})/);
        if (m) {
          const cand = m[1].trim().replace(/\s+/g, ' ');
          const words = cand.split(' ').filter(w => w.length >= 2);
          // Chấp nhận 2-5 từ, mỗi từ bắt đầu bằng chữ cái (bất kể HOA/thường)
          if (words.length >= 2 && words.length <= 5
            && words.every(w => /^\p{L}[\p{L}\p{M}]*$/u.test(w))) {
            data.ho_ten = words.join(' ');
            break;
          }
        }
      }
    }

    // Cách 2 (fallback): dòng in HOA 2-5 từ, không phải header
    if (!data.ho_ten) {
      const excludeRe = /trường|đại\s*học|cao\s*đẳng|học\s*viện|thẻ\s*sinh|bộ\s|khoa\s*học|chứng\s*nhận|university|college|institute|sinh\s*viên|ngành|khóa|bậc|lớp|xã\s*hội|lao\s*động|thương\s*binh/i;
      for (const line of lines) {
        if (excludeRe.test(line)) continue;
        const clean = line.replace(/[|:.\-©®"'>]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = clean.split(' ').filter(w => w.length >= 2);
        if (words.length >= 2 && words.length <= 5) {
          const allUpper = words.every(w => /^\p{Lu}[\p{Lu}\p{M}]*$/u.test(w));
          if (allUpper) { data.ho_ten = words.join(' '); break; }
        }
      }
    }

    // Fallback: dòng in HOA 2-5 từ, không phải header
    if (!data.ho_ten) {
      const excludeRe = /trường|đại\s*học|cao\s*đẳng|học\s*viện|thẻ\s*sinh|bộ\s|khoa\s*học|chứng\s*nhận|university|college|institute|sinh\s*viên|ngành|khóa|bậc|lớp|xã\s*hội|lao\s*động|thương\s*binh/i;
      for (const line of lines) {
        if (excludeRe.test(line)) continue;
        const clean = line.replace(/[|:.\-©®"'>]/g, ' ').replace(/\s+/g, ' ').trim();
        const words = clean.split(' ').filter(w => w.length >= 2);
        if (words.length >= 2 && words.length <= 5) {
          const allUpper = words.every(w => /^[\p{Lu}\p{M}]{2,}$/u.test(w));
          if (allUpper) { data.ho_ten = words.join(' '); break; }
        }
      }
    }

    // ---------- 3. TRƯỜNG ----------
    // ---------- 3. TRƯỜNG ----------
    const excludeSchoolRe = /bậc|ngành|khóa|hệ\s|sinh\s*viên|thẻ\s*sinh|lớp\s|chứng\s*nhận|xã\s*hội|lao\s*động|thương\s*binh/i;

    for (const line of lines) {
      if (excludeSchoolRe.test(line)) continue;
      if (/(trường|đại\s*học|cao\s*đẳng|học\s*viện|university|college|institute)/iu.test(line)
        && line.length >= 10 && line.length <= 150) {

        let clean = line;

        // ✂️ Cắt từ vị trí "TRƯỜNG"/"ĐẠI HỌC"/"CAO ĐẲNG"/"HỌC VIỆN"
        const idx = clean.search(/(trường|đại\s*học|cao\s*đẳng|học\s*viện|university|college|institute)/iu);
        if (idx > 0) clean = clean.substring(idx);

        // ✂️ Bỏ ký tự rác cuối
        clean = clean
          .replace(/[\s"',;:.\-|>\]\)©®\[\]\(]+$/g, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (clean.length >= 10) {
          data.truong = clean;
          break;
        }
      }
    }

    // ---------- 4. NGÀY SINH ----------
    const dobMatch = normalized.match(/(?:ngày\s*sinh|ngay\s*sinh|dob|date\s*of\s*birth)[\s:.\-|]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/iu);
    if (dobMatch) data.ngay_sinh = dobMatch[1];

    // ---------- 5. KHOA ----------
    for (const line of lines) {
      if (/khóa/i.test(line)) continue;
      const m = line.match(/(?:^|\s)khoa\s*[:\-|.]?\s*([^\n|]{3,60})/iu);
      if (m) { data.khoa = m[1].trim(); break; }
    }

    // ---------- 6. LỚP ----------
    const lopMatch = normalized.match(/(?:lớp|class)\s*[:\-|.]?\s*([A-Z0-9]{2,20})/i);
    if (lopMatch) data.lop = lopMatch[1].trim();

    return data;
  },

  // ============ PARSE CHỨNG CHỈ ============
  parseChungChi(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 2);
    const data = { ten_chung_chi: '', to_chuc: '', ngay_cap: '', raw: text };

    // Tên chứng chỉ
    const tenKw = /(certificate|chứng\s*nhận|chứng\s*chỉ|ielts|toeic|toefl|mos|ic3|hsk|jlpt)/i;
    for (const line of lines) {
      if (tenKw.test(line) && line.length < 120) { data.ten_chung_chi = line; break; }
    }

    // Tổ chức
    const orgKw = /(university|institute|center|trung\s*tâm|công\s*ty|tổ\s*chức|academy|học\s*viện)/i;
    for (const line of lines) {
      if (orgKw.test(line) && line.length < 120) { data.to_chuc = line; break; }
    }

    // Ngày cấp
    const dateM = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dateM) {
      const dd = dateM[1].padStart(2, '0');
      const mm = dateM[2].padStart(2, '0');
      data.ngay_cap = `${dateM[3]}-${mm}-${dd}`;
    }

    return data;
  },

  // ============ OCR CHO NHÀ TUYỂN DỤNG ============
  async scanEmployer(file, loai, onProgress) {
    if (!window.Tesseract) throw new Error('Tesseract chưa load');

    if (onProgress) onProgress(5);
    const processedFile = await this.preprocessImage(file);
    if (onProgress) onProgress(15);

    const result = await Tesseract.recognize(processedFile, 'vie+eng', {
      logger: m => {
        if (onProgress && m.status === 'recognizing text')
          onProgress(15 + Math.round(m.progress * 85));
      },
      tessedit_pageseg_mode: '4',
      preserve_interword_spaces: '1'
    });

    const raw = result.data.text || '';
    return { raw, parsed: this.parseEmployerDoc(raw, loai) };
  },

  parseEmployerDoc(text, loai) {
    const data = {
      ten: '', ma_so_thue: '', ma_so_hkd: '',
      cccd: '', nguoi_dai_dien: '', dia_chi: '', raw: text
    };
    const normalized = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 1);

    // CÁ NHÂN: CCCD
    if (loai === 'ca_nhan') {
      const cccdM = normalized.match(/\b(\d{12})\b/);
      if (cccdM) data.cccd = cccdM[1];

      const nameM = normalized.match(/(?:họ\s*và\s*tên|họ\s*tên|full\s*name)[\s:.\-|]*([A-ZÀ-Ỹ][^\n|:]{2,50})/iu);
      if (nameM) {
        data.ten = nameM[1].trim().replace(/\s+/g, ' ');
        data.nguoi_dai_dien = data.ten;
      }

      const addrM = normalized.match(/(?:địa\s*chỉ|thường\s*trú|nơi\s*ở)[\s:.\-|]*([^\n|]{5,120})/iu);
      if (addrM) data.dia_chi = addrM[1].trim();
    }

    // DOANH NGHIỆP: MST
    if (loai === 'doanh_nghiep') {
      const mstM = normalized.match(/(?:mã\s*số\s*thuế|mst|tax\s*code)[\s:.\-|]*(\d{10}(?:[\-\s]\d{3})?)/iu);
      if (mstM) data.ma_so_thue = mstM[1].replace(/[\s\-]/g, '');
      else {
        const m = normalized.match(/\b(\d{10,13})\b/);
        if (m) data.ma_so_thue = m[1];
      }

      for (const line of lines) {
        if (/(công\s*ty|tnhh|cổ\s*phần|doanh\s*nghiệp|cp\s|jsc)/iu.test(line) && line.length < 200) {
          data.ten = line.replace(/^[|:.\-©®"'>\s]+/g, '').trim();
          break;
        }
      }

      const daiDienM = normalized.match(/(?:người\s*đại\s*diện|đại\s*diện|giám\s*đốc)[\s:.\-|]*([A-ZÀ-Ỹ][^\n|:]{2,50})/iu);
      if (daiDienM) data.nguoi_dai_dien = daiDienM[1].trim();

      const addrM = normalized.match(/(?:địa\s*chỉ|trụ\s*sở)[\s:.\-|]*([^\n|]{5,150})/iu);
      if (addrM) data.dia_chi = addrM[1].trim();
    }

    // HỘ KINH DOANH: MSHKD
    if (loai === 'ho_kinh_doanh') {
      const hkdM = normalized.match(/(?:mã\s*số\s*hộ\s*kinh\s*doanh|mã\s*số\s*hkd|số\s*đăng\s*ký)[\s:.\-|]*([A-Z0-9\-\s]{6,25})/iu);
      if (hkdM) data.ma_so_hkd = hkdM[1].replace(/\s/g, '').toUpperCase();
      else {
        const m = normalized.match(/\b([0-9]{2}[A-Z]?[0-9]{6,10})\b/);
        if (m) data.ma_so_hkd = m[1];
      }

      for (const line of lines) {
        if (/(hộ\s*kinh\s*doanh|hkd|hộ\s*kd)/iu.test(line) && line.length < 150) {
          data.ten = line.replace(/^[|:.\-©®"'>\s]+/g, '').trim();
          break;
        }
      }

      const daiDienM = normalized.match(/(?:chủ\s*hộ|người\s*đại\s*diện|họ\s*và\s*tên)[\s:.\-|]*([A-ZÀ-Ỹ][^\n|:]{2,50})/iu);
      if (daiDienM) data.nguoi_dai_dien = daiDienM[1].trim();

      const addrM = normalized.match(/(?:địa\s*chỉ|trụ\s*sở)[\s:.\-|]*([^\n|]{5,150})/iu);
      if (addrM) data.dia_chi = addrM[1].trim();
    }

    return data;
  },
};