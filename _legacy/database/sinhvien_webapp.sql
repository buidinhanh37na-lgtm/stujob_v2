-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 30, 2026 at 02:26 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sinhvien_webapp`
--

-- --------------------------------------------------------

--
-- Table structure for table `bao_dam_thanh_toan`
--

CREATE TABLE `bao_dam_thanh_toan` (
  `id` int NOT NULL,
  `ung_tuyen_id` int DEFAULT NULL,
  `nha_tuyen_dung_id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `so_tien` decimal(14,2) NOT NULL,
  `trang_thai` enum('cho_ky_quy','da_ky_quy','da_giai_ngan','huy','cho_nap','da_nap','cho_nghiem_thu','hoan_tien') DEFAULT 'cho_nap',
  `ghi_chu` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `viec_lam_id` int DEFAULT NULL,
  `phi_dich_vu` decimal(14,2) DEFAULT '0.00',
  `ma_giao_dich` varchar(30) DEFAULT NULL,
  `ngay_giai_ngan` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bao_dam_thanh_toan`
--

INSERT INTO `bao_dam_thanh_toan` (`id`, `ung_tuyen_id`, `nha_tuyen_dung_id`, `sinh_vien_id`, `so_tien`, `trang_thai`, `ghi_chu`, `created_at`, `viec_lam_id`, `phi_dich_vu`, `ma_giao_dich`, `ngay_giai_ngan`) VALUES
(2, 4, 5, 1, 1150000.00, 'da_nap', NULL, '2026-09-16 16:30:00', 9, 0.00, 'ESC1789576200502', NULL),
(3, 5, 4, 1, 1500000.00, 'da_giai_ngan', NULL, '2026-09-17 00:59:03', 10, 0.00, 'ESC1789606743941', '2026-09-18 19:17:39'),
(6, 16, 7, 3, 1500000.00, 'cho_nap', NULL, '2026-09-17 15:53:01', 15, 0.00, 'ESC1789660381655', NULL),
(8, 20, 9, 1, 1500000.00, 'cho_nap', NULL, '2026-09-17 16:28:59', 23, 0.00, 'ESC1789662539390', NULL),
(11, 23, 10, 1, 1800000.00, 'cho_nap', NULL, '2026-09-17 16:49:11', 29, 0.00, 'ESC1789663751208', NULL),
(12, 24, 4, 2, 1200000.00, 'da_giai_ngan', NULL, '2026-09-18 09:37:48', 30, 0.00, 'ESC1789724268834', '2026-09-18 16:38:37'),
(13, 25, 4, 3, 1000000.00, 'da_giai_ngan', NULL, '2026-09-18 13:54:30', 33, 0.00, 'ESC1789739670244', '2026-09-20 09:27:47'),
(14, 26, 4, 1, 5000000.00, 'da_giai_ngan', NULL, '2026-09-20 02:10:57', 34, 500000.00, 'ESC1789870257107', '2026-09-20 09:14:02'),
(15, 27, 4, 1, 2000000.00, 'da_nap', NULL, '2026-09-20 02:26:52', 35, 200000.00, 'ESC1789871212585', NULL),
(16, 28, 4, 1, 2000000.00, 'da_giai_ngan', NULL, '2026-09-20 02:29:23', 36, 200000.00, 'ESC1789871363970', '2026-09-20 09:30:32'),
(17, NULL, 7, 1, 960185.00, 'da_giai_ngan', NULL, '2026-09-20 06:32:03', 1, 96019.00, 'DEMO_20260920_00', '2026-09-20 13:32:03'),
(18, NULL, 7, 1, 3280264.00, 'da_giai_ngan', NULL, '2026-09-19 06:32:03', 1, 328026.00, 'DEMO_20260919_00', '2026-09-19 13:32:03'),
(19, NULL, 7, 1, 2531823.00, 'da_giai_ngan', NULL, '2026-09-19 06:32:03', 1, 253182.00, 'DEMO_20260919_01', '2026-09-19 13:32:03'),
(20, NULL, 7, 1, 2318325.00, 'da_giai_ngan', NULL, '2026-09-19 06:32:03', 1, 231833.00, 'DEMO_20260919_02', '2026-09-19 13:32:03'),
(21, NULL, 7, 1, 3140592.00, 'da_giai_ngan', NULL, '2026-09-18 06:32:03', 1, 314059.00, 'DEMO_20260918_00', '2026-09-18 13:32:03'),
(22, NULL, 7, 1, 652602.00, 'da_giai_ngan', NULL, '2026-09-17 06:32:03', 1, 65260.00, 'DEMO_20260917_00', '2026-09-17 13:32:03'),
(23, NULL, 7, 1, 4412235.00, 'da_giai_ngan', NULL, '2026-09-16 06:32:03', 1, 441224.00, 'DEMO_20260916_00', '2026-09-16 13:32:03'),
(24, NULL, 7, 1, 1251914.00, 'da_giai_ngan', NULL, '2026-09-16 06:32:03', 1, 125191.00, 'DEMO_20260916_01', '2026-09-16 13:32:03'),
(25, NULL, 7, 1, 2724307.00, 'da_giai_ngan', NULL, '2026-09-15 06:32:03', 1, 272431.00, 'DEMO_20260915_00', '2026-09-15 13:32:03'),
(26, NULL, 7, 1, 3045795.00, 'da_giai_ngan', NULL, '2026-09-15 06:32:03', 1, 304580.00, 'DEMO_20260915_01', '2026-09-15 13:32:03'),
(27, NULL, 7, 1, 2056056.00, 'da_giai_ngan', NULL, '2026-09-15 06:32:03', 1, 205606.00, 'DEMO_20260915_02', '2026-09-15 13:32:03'),
(28, NULL, 7, 1, 2802894.00, 'da_giai_ngan', NULL, '2026-09-14 06:32:03', 1, 280289.00, 'DEMO_20260914_00', '2026-09-14 13:32:03'),
(29, NULL, 7, 1, 3218041.00, 'da_giai_ngan', NULL, '2026-09-13 06:32:03', 1, 321804.00, 'DEMO_20260913_00', '2026-09-13 13:32:03'),
(30, NULL, 7, 1, 3683447.00, 'da_giai_ngan', NULL, '2026-09-13 06:32:03', 1, 368345.00, 'DEMO_20260913_01', '2026-09-13 13:32:03'),
(31, NULL, 7, 1, 2036711.00, 'da_giai_ngan', NULL, '2026-09-12 06:32:03', 1, 203671.00, 'DEMO_20260912_00', '2026-09-12 13:32:03'),
(32, NULL, 7, 1, 1387931.00, 'da_giai_ngan', NULL, '2026-09-12 06:32:03', 1, 138793.00, 'DEMO_20260912_01', '2026-09-12 13:32:03'),
(33, NULL, 7, 1, 4829525.00, 'da_giai_ngan', NULL, '2026-09-12 06:32:03', 1, 482953.00, 'DEMO_20260912_02', '2026-09-12 13:32:03'),
(34, NULL, 7, 1, 2201389.00, 'da_giai_ngan', NULL, '2026-09-11 06:32:03', 1, 220139.00, 'DEMO_20260911_00', '2026-09-11 13:32:03'),
(35, NULL, 7, 1, 1714014.00, 'da_giai_ngan', NULL, '2026-09-10 06:32:03', 1, 171401.00, 'DEMO_20260910_00', '2026-09-10 13:32:03'),
(36, NULL, 7, 1, 2183639.00, 'da_giai_ngan', NULL, '2026-09-09 06:32:03', 1, 218364.00, 'DEMO_20260909_00', '2026-09-09 13:32:03'),
(37, NULL, 7, 1, 4030337.00, 'da_giai_ngan', NULL, '2026-09-09 06:32:03', 1, 403034.00, 'DEMO_20260909_01', '2026-09-09 13:32:03'),
(38, NULL, 7, 1, 4100765.00, 'da_giai_ngan', NULL, '2026-09-09 06:32:03', 1, 410077.00, 'DEMO_20260909_02', '2026-09-09 13:32:03'),
(39, NULL, 7, 1, 1570479.00, 'da_giai_ngan', NULL, '2026-09-08 06:32:03', 1, 157048.00, 'DEMO_20260908_00', '2026-09-08 13:32:03'),
(40, NULL, 7, 1, 3567041.00, 'da_giai_ngan', NULL, '2026-09-08 06:32:03', 1, 356704.00, 'DEMO_20260908_01', '2026-09-08 13:32:03'),
(41, NULL, 7, 1, 3623769.00, 'da_giai_ngan', NULL, '2026-09-08 06:32:03', 1, 362377.00, 'DEMO_20260908_02', '2026-09-08 13:32:03'),
(42, NULL, 7, 1, 2417721.00, 'da_giai_ngan', NULL, '2026-09-08 06:32:03', 1, 241772.00, 'DEMO_20260908_03', '2026-09-08 13:32:03'),
(43, NULL, 7, 1, 3514777.00, 'da_giai_ngan', NULL, '2026-09-07 06:32:03', 1, 351478.00, 'DEMO_20260907_00', '2026-09-07 13:32:03'),
(44, NULL, 7, 1, 2573881.00, 'da_giai_ngan', NULL, '2026-09-07 06:32:03', 1, 257388.00, 'DEMO_20260907_01', '2026-09-07 13:32:03'),
(45, NULL, 7, 1, 1825075.00, 'da_giai_ngan', NULL, '2026-09-07 06:32:03', 1, 182508.00, 'DEMO_20260907_02', '2026-09-07 13:32:03'),
(46, NULL, 7, 1, 903732.00, 'da_giai_ngan', NULL, '2026-09-07 06:32:03', 1, 90373.00, 'DEMO_20260907_03', '2026-09-07 13:32:03'),
(47, NULL, 7, 1, 899616.00, 'da_giai_ngan', NULL, '2026-09-06 06:32:03', 1, 89962.00, 'DEMO_20260906_00', '2026-09-06 13:32:03'),
(48, NULL, 7, 1, 3980128.00, 'da_giai_ngan', NULL, '2026-09-06 06:32:03', 1, 398013.00, 'DEMO_20260906_01', '2026-09-06 13:32:03'),
(49, NULL, 7, 1, 3201794.00, 'da_giai_ngan', NULL, '2026-09-06 06:32:03', 1, 320179.00, 'DEMO_20260906_02', '2026-09-06 13:32:03'),
(50, NULL, 7, 1, 4981936.00, 'da_giai_ngan', NULL, '2026-09-05 06:32:03', 1, 498194.00, 'DEMO_20260905_00', '2026-09-05 13:32:03'),
(51, NULL, 7, 1, 1197067.00, 'da_giai_ngan', NULL, '2026-09-05 06:32:03', 1, 119707.00, 'DEMO_20260905_01', '2026-09-05 13:32:03'),
(52, NULL, 7, 1, 4039531.00, 'da_giai_ngan', NULL, '2026-09-05 06:32:03', 1, 403953.00, 'DEMO_20260905_02', '2026-09-05 13:32:03'),
(53, NULL, 7, 1, 2749020.00, 'da_giai_ngan', NULL, '2026-09-04 06:32:03', 1, 274902.00, 'DEMO_20260904_00', '2026-09-04 13:32:03'),
(54, NULL, 7, 1, 3004072.00, 'da_giai_ngan', NULL, '2026-09-04 06:32:03', 1, 300407.00, 'DEMO_20260904_01', '2026-09-04 13:32:03'),
(55, NULL, 7, 1, 1773300.00, 'da_giai_ngan', NULL, '2026-09-04 06:32:03', 1, 177330.00, 'DEMO_20260904_02', '2026-09-04 13:32:03'),
(56, NULL, 7, 1, 3854285.00, 'da_giai_ngan', NULL, '2026-09-04 06:32:03', 1, 385429.00, 'DEMO_20260904_03', '2026-09-04 13:32:03'),
(57, NULL, 7, 1, 1119288.00, 'da_giai_ngan', NULL, '2026-09-03 06:32:03', 1, 111929.00, 'DEMO_20260903_00', '2026-09-03 13:32:03'),
(58, NULL, 7, 1, 4477358.00, 'da_giai_ngan', NULL, '2026-09-02 06:32:03', 1, 447736.00, 'DEMO_20260902_00', '2026-09-02 13:32:03'),
(59, NULL, 7, 1, 1778556.00, 'da_giai_ngan', NULL, '2026-09-02 06:32:03', 1, 177856.00, 'DEMO_20260902_01', '2026-09-02 13:32:03'),
(60, NULL, 7, 1, 3960709.00, 'da_giai_ngan', NULL, '2026-09-02 06:32:03', 1, 396071.00, 'DEMO_20260902_02', '2026-09-02 13:32:03'),
(61, NULL, 7, 1, 1882638.00, 'da_giai_ngan', NULL, '2026-09-01 06:32:03', 1, 188264.00, 'DEMO_20260901_00', '2026-09-01 13:32:03'),
(62, NULL, 7, 1, 3041433.00, 'da_giai_ngan', NULL, '2026-09-01 06:32:03', 1, 304143.00, 'DEMO_20260901_01', '2026-09-01 13:32:03'),
(63, NULL, 7, 1, 4559249.00, 'da_giai_ngan', NULL, '2026-09-01 06:32:03', 1, 455925.00, 'DEMO_20260901_02', '2026-09-01 13:32:03'),
(64, NULL, 7, 1, 2394114.00, 'da_giai_ngan', NULL, '2026-08-31 06:32:03', 1, 239411.00, 'DEMO_20260831_00', '2026-08-31 13:32:03'),
(65, NULL, 7, 1, 4924599.00, 'da_giai_ngan', NULL, '2026-08-31 06:32:03', 1, 492460.00, 'DEMO_20260831_01', '2026-08-31 13:32:03'),
(66, NULL, 7, 1, 3325360.00, 'da_giai_ngan', NULL, '2026-08-30 06:32:03', 1, 332536.00, 'DEMO_20260830_00', '2026-08-30 13:32:03'),
(67, NULL, 7, 1, 1338412.00, 'da_giai_ngan', NULL, '2026-08-30 06:32:03', 1, 133841.00, 'DEMO_20260830_01', '2026-08-30 13:32:03'),
(68, NULL, 7, 1, 1675381.00, 'da_giai_ngan', NULL, '2026-08-29 06:32:03', 1, 167538.00, 'DEMO_20260829_00', '2026-08-29 13:32:03'),
(69, NULL, 7, 1, 1682915.00, 'da_giai_ngan', NULL, '2026-08-29 06:32:03', 1, 168292.00, 'DEMO_20260829_01', '2026-08-29 13:32:03'),
(70, NULL, 7, 1, 2888431.00, 'da_giai_ngan', NULL, '2026-08-29 06:32:03', 1, 288843.00, 'DEMO_20260829_02', '2026-08-29 13:32:03'),
(71, NULL, 7, 1, 828566.00, 'da_giai_ngan', NULL, '2026-08-28 06:32:03', 1, 82857.00, 'DEMO_20260828_00', '2026-08-28 13:32:03'),
(72, NULL, 7, 1, 1237553.00, 'da_giai_ngan', NULL, '2026-08-28 06:32:03', 1, 123755.00, 'DEMO_20260828_01', '2026-08-28 13:32:03'),
(73, NULL, 7, 1, 3202067.00, 'da_giai_ngan', NULL, '2026-08-28 06:32:03', 1, 320207.00, 'DEMO_20260828_02', '2026-08-28 13:32:03'),
(74, NULL, 7, 1, 1517932.00, 'da_giai_ngan', NULL, '2026-08-27 06:32:03', 1, 151793.00, 'DEMO_20260827_00', '2026-08-27 13:32:03'),
(75, NULL, 7, 1, 4443080.00, 'da_giai_ngan', NULL, '2026-08-27 06:32:03', 1, 444308.00, 'DEMO_20260827_01', '2026-08-27 13:32:03'),
(76, NULL, 7, 1, 3661603.00, 'da_giai_ngan', NULL, '2026-08-27 06:32:03', 1, 366160.00, 'DEMO_20260827_02', '2026-08-27 13:32:03'),
(77, NULL, 7, 1, 4478778.00, 'da_giai_ngan', NULL, '2026-08-27 06:32:03', 1, 447878.00, 'DEMO_20260827_03', '2026-08-27 13:32:03'),
(78, NULL, 7, 1, 3318081.00, 'da_giai_ngan', NULL, '2026-08-26 06:32:03', 1, 331808.00, 'DEMO_20260826_00', '2026-08-26 13:32:03'),
(79, NULL, 7, 1, 2263216.00, 'da_giai_ngan', NULL, '2026-08-26 06:32:03', 1, 226322.00, 'DEMO_20260826_01', '2026-08-26 13:32:03'),
(80, NULL, 7, 1, 861835.00, 'da_giai_ngan', NULL, '2026-08-26 06:32:03', 1, 86184.00, 'DEMO_20260826_02', '2026-08-26 13:32:03'),
(81, NULL, 7, 1, 1519530.00, 'da_giai_ngan', NULL, '2026-08-26 06:32:03', 1, 151953.00, 'DEMO_20260826_03', '2026-08-26 13:32:03'),
(82, NULL, 7, 1, 1474271.00, 'da_giai_ngan', NULL, '2026-08-25 06:32:03', 1, 147427.00, 'DEMO_20260825_00', '2026-08-25 13:32:03'),
(83, NULL, 7, 1, 3864929.00, 'da_giai_ngan', NULL, '2026-08-25 06:32:03', 1, 386493.00, 'DEMO_20260825_01', '2026-08-25 13:32:03'),
(84, NULL, 7, 1, 901835.00, 'da_giai_ngan', NULL, '2026-08-25 06:32:03', 1, 90184.00, 'DEMO_20260825_02', '2026-08-25 13:32:03'),
(85, NULL, 7, 1, 1414386.00, 'da_giai_ngan', NULL, '2026-08-25 06:32:03', 1, 141439.00, 'DEMO_20260825_03', '2026-08-25 13:32:03'),
(86, NULL, 7, 1, 2345592.00, 'da_giai_ngan', NULL, '2026-08-24 06:32:03', 1, 234559.00, 'DEMO_20260824_00', '2026-08-24 13:32:03'),
(87, NULL, 7, 1, 1958937.00, 'da_giai_ngan', NULL, '2026-08-23 06:32:03', 1, 195894.00, 'DEMO_20260823_00', '2026-08-23 13:32:03'),
(88, NULL, 7, 1, 4384040.00, 'da_giai_ngan', NULL, '2026-08-22 06:32:03', 1, 438404.00, 'DEMO_20260822_00', '2026-08-22 13:32:03');

-- --------------------------------------------------------

--
-- Table structure for table `cau_hinh_he_thong`
--

CREATE TABLE `cau_hinh_he_thong` (
  `khoa` varchar(100) NOT NULL,
  `gia_tri` text,
  `mo_ta` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `cau_hinh_he_thong`
--

INSERT INTO `cau_hinh_he_thong` (`khoa`, `gia_tri`, `mo_ta`, `updated_at`) VALUES
('che_do_kiem_duyet', 'tu_dong', 'Chế độ kiểm duyệt: tu_dong | thu_cong | tat', '2026-09-17 13:04:59'),
('email_ho_tro', 'support@stujob.vn', 'Email hỗ trợ', '2026-09-17 13:04:59'),
('hotline', '1900-xxxx', 'Hotline hỗ trợ', '2026-09-17 13:04:59'),
('nguong_rui_ro_canh_bao', '5', 'Điểm rủi ro >= ngưỡng này sẽ cảnh báo', '2026-09-17 13:04:59'),
('nguong_rui_ro_tu_dong_chan', '8', 'Điểm rủi ro >= ngưỡng này sẽ tự chặn', '2026-09-17 13:04:59'),
('phi_dich_vu', '10', 'Phí dịch vụ (%) sau N tin đầu', '2026-09-17 13:04:59'),
('so_tien_hoan_mac_dinh', '100', 'Tỷ lệ hoàn tiền mặc định (%)', '2026-09-17 13:04:59'),
('so_tin_mien_phi', '5', 'Số tin miễn phí cho NTD mới', '2026-09-17 13:04:59');

-- --------------------------------------------------------

--
-- Table structure for table `chung_chi`
--

CREATE TABLE `chung_chi` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `ten_chung_chi` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_chuc` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_cap` date DEFAULT NULL,
  `file_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `danh_gia`
--

CREATE TABLE `danh_gia` (
  `id` int NOT NULL,
  `nha_tuyen_dung_id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `nhiem_vu_id` int DEFAULT NULL,
  `diem` tinyint NOT NULL,
  `nhan_xet` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `viec_lam_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `danh_gia`
--

INSERT INTO `danh_gia` (`id`, `nha_tuyen_dung_id`, `sinh_vien_id`, `nhiem_vu_id`, `diem`, `nhan_xet`, `created_at`, `viec_lam_id`) VALUES
(1, 4, 2, NULL, 4, '', '2026-09-18 12:17:33', 30),
(2, 4, 1, NULL, 5, '', '2026-09-18 12:17:45', 10);

-- --------------------------------------------------------

--
-- Table structure for table `giao_dich`
--

CREATE TABLE `giao_dich` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `nhiem_vu_id` int DEFAULT NULL,
  `so_tien` decimal(14,2) NOT NULL,
  `phi_san` decimal(14,2) DEFAULT '0.00',
  `loai` enum('thu_nhap','rut_tien') COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('cho_xu_ly','thanh_cong','that_bai') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_xu_ly',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `giao_dich`
--

INSERT INTO `giao_dich` (`id`, `sinh_vien_id`, `nhiem_vu_id`, `so_tien`, `phi_san`, `loai`, `mo_ta`, `trang_thai`, `created_at`) VALUES
(1, 2, NULL, 1200000.00, 0.00, 'thu_nhap', 'Thu nhập từ nghiệm thu: Gia sư môn [MÔN] lớp [LỚP]', 'thanh_cong', '2026-09-18 09:38:37'),
(2, 1, NULL, 1500000.00, 0.00, 'thu_nhap', 'Thu nhập từ nghiệm thu: Nhân viên bán hàng online', 'thanh_cong', '2026-09-18 12:17:39'),
(3, 1, NULL, 100000.00, 0.00, 'rut_tien', 'Rút tiền #1 về BIDV - 0977628192123422', 'thanh_cong', '2026-09-18 12:57:59'),
(4, 1, NULL, 5000000.00, 0.00, 'thu_nhap', 'Thu nhập từ nghiệm thu: Thiết kế giao diện website dạy học trực tuyến 🎓', 'thanh_cong', '2026-09-20 02:14:02'),
(5, 3, NULL, 1000000.00, 0.00, 'thu_nhap', 'Thu nhập từ nghiệm thu: Gia sư môn [MÔN] lớp [LỚP]', 'thanh_cong', '2026-09-20 02:27:47'),
(6, 1, NULL, 2000000.00, 0.00, 'thu_nhap', 'Thu nhập từ nghiệm thu: Designer làm poster/social', 'thanh_cong', '2026-09-20 02:30:32'),
(7, 1, NULL, 1563259.00, 48348.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-20 06:32:03'),
(8, 1, NULL, 2422515.00, 74923.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-19 06:32:03'),
(9, 1, NULL, 2182838.00, 67510.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-18 06:32:03'),
(10, 1, NULL, 2519098.00, 77910.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-17 06:32:03'),
(11, 1, NULL, 1146452.00, 35457.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-16 06:32:03'),
(12, 1, NULL, 577407.00, 17858.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-15 06:32:03'),
(13, 1, NULL, 1051170.00, 32510.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-14 06:32:03'),
(14, 1, NULL, 2595144.00, 80262.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-13 06:32:03'),
(15, 1, NULL, 1121209.00, 34677.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-12 06:32:03'),
(16, 1, NULL, 1270843.00, 39304.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-11 06:32:03'),
(17, 1, NULL, 2524759.00, 78085.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-10 06:32:03'),
(18, 1, NULL, 2368621.00, 73256.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-09 06:32:03'),
(19, 1, NULL, 625520.00, 19346.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-08 06:32:03'),
(20, 1, NULL, 2129755.00, 65869.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-07 06:32:03'),
(21, 1, NULL, 2469350.00, 76372.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-06 06:32:03'),
(22, 1, NULL, 1847173.00, 57129.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-05 06:32:03'),
(23, 1, NULL, 3040319.00, 94031.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-04 06:32:03'),
(24, 1, NULL, 1139505.00, 35242.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-03 06:32:03'),
(25, 1, NULL, 3374226.00, 104358.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-02 06:32:03'),
(26, 1, NULL, 2859526.00, 88439.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-09-01 06:32:03'),
(27, 1, NULL, 2386621.00, 73813.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-31 06:32:03'),
(28, 1, NULL, 624666.00, 19320.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-30 06:32:03'),
(29, 1, NULL, 3002739.00, 92868.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-29 06:32:03'),
(30, 1, NULL, 1970832.00, 60954.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-28 06:32:03'),
(31, 1, NULL, 1396204.00, 43182.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-27 06:32:03'),
(32, 1, NULL, 3079521.00, 95243.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-26 06:32:03'),
(33, 1, NULL, 2661955.00, 82329.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-25 06:32:03'),
(34, 1, NULL, 2399803.00, 74221.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-24 06:32:03'),
(35, 1, NULL, 1771517.00, 54789.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-23 06:32:03'),
(36, 1, NULL, 2236660.00, 69175.00, 'thu_nhap', 'DEMO thu nhập', 'thanh_cong', '2026-08-22 06:32:03');

-- --------------------------------------------------------

--
-- Table structure for table `khieu_nai`
--

CREATE TABLE `khieu_nai` (
  `id` int NOT NULL,
  `nguoi_gui_loai` enum('sinh_vien','nha_tuyen_dung') NOT NULL,
  `nguoi_gui_id` int NOT NULL,
  `doi_tuong_loai` enum('sinh_vien','nha_tuyen_dung','he_thong') DEFAULT NULL,
  `doi_tuong_id` int DEFAULT NULL,
  `viec_lam_id` int DEFAULT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text NOT NULL,
  `bang_chung` text,
  `trang_thai` enum('cho_xu_ly','dang_xu_ly','da_giai_quyet','da_dong') DEFAULT 'cho_xu_ly',
  `uu_tien` enum('thap','trung_binh','cao','khan_cap') DEFAULT 'trung_binh',
  `admin_id` int DEFAULT NULL,
  `ket_qua` text,
  `huong_xu_ly` enum('hoan_tien_sv','hoan_tien_ntd','chia_doi','khong_hoan','khac') DEFAULT NULL,
  `so_tien_hoan` decimal(14,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kiem_duyet_tin`
--

CREATE TABLE `kiem_duyet_tin` (
  `id` int NOT NULL,
  `viec_lam_id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `hanh_dong` enum('duyet','chan','canh_bao') DEFAULT 'duyet',
  `ly_do` varchar(255) DEFAULT NULL,
  `diem_rui_ro` int DEFAULT '0',
  `tu_khoa_phat_hien` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `kiem_duyet_tin`
--

INSERT INTO `kiem_duyet_tin` (`id`, `viec_lam_id`, `admin_id`, `hanh_dong`, `ly_do`, `diem_rui_ro`, `tu_khoa_phat_hien`, `created_at`) VALUES
(1, 1, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(2, 2, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(3, 3, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(4, 4, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(5, 5, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(6, 6, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(7, 9, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(8, 10, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-17 13:46:40'),
(9, 11, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(10, 12, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(11, 13, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(12, 14, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(13, 15, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(14, 16, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(15, 21, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(16, 22, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(17, 23, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(18, 29, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(19, 30, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(20, 31, 1, 'duyet', 'Quét tự động', -1, '', '2026-09-18 09:40:02'),
(21, 31, 1, 'duyet', 'Admin duyệt thủ công', 0, '', '2026-09-18 09:40:16');

-- --------------------------------------------------------

--
-- Table structure for table `ky_nang`
--

CREATE TABLE `ky_nang` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `ten_ky_nang` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `muc_do` enum('co_ban','trung_binh','kha','gioi','xuat_sac') COLLATE utf8mb4_unicode_ci DEFAULT 'trung_binh'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ky_nang`
--

INSERT INTO `ky_nang` (`id`, `sinh_vien_id`, `ten_ky_nang`, `muc_do`) VALUES
(2, 2, 'Thiết kế đồ họa', 'gioi'),
(3, 2, 'thiết kế banner', 'xuat_sac'),
(7, 3, 'Web', 'gioi'),
(8, 3, 'Android', 'kha'),
(9, 1, 'HTML, Java, C++, PHP, MySQL,', 'gioi'),
(10, 1, 'Android studio', 'kha');

-- --------------------------------------------------------

--
-- Table structure for table `lich_hoc`
--

CREATE TABLE `lich_hoc` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `thu` tinyint NOT NULL,
  `gio_bat_dau` time NOT NULL,
  `gio_ket_thuc` time NOT NULL,
  `mon_hoc` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phong_hoc` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ghi_chu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lich_hoc`
--

INSERT INTO `lich_hoc` (`id`, `sinh_vien_id`, `thu`, `gio_bat_dau`, `gio_ket_thuc`, `mon_hoc`, `phong_hoc`, `ghi_chu`) VALUES
(9, 2, 2, '07:00:00', '09:30:00', 'Lập trình hướng đối tượng', 'A101', ''),
(10, 2, 2, '13:30:00', '16:00:00', 'Cơ sở dữ liệu', 'B202', ''),
(11, 2, 3, '07:00:00', '09:30:00', 'Giải tích 2', 'A102', ''),
(12, 2, 4, '09:30:00', '11:30:00', 'Kỹ thuật lập trình', 'Lab3', ''),
(13, 2, 4, '13:30:00', '16:00:00', 'Tiếng Anh B1', 'D404', ''),
(14, 2, 5, '07:00:00', '09:30:00', 'Mạng máy tính', 'B301', ''),
(15, 2, 6, '13:30:00', '16:00:00', 'Lập trình Web', 'Lab1', ''),
(16, 2, 7, '07:00:00', '10:00:00', 'Thể dục', 'Nhà thi đấu', ''),
(17, 3, 2, '07:00:00', '09:30:00', 'Lập trình hướng đối tượng', 'A101', ''),
(18, 3, 2, '13:30:00', '16:00:00', 'Cơ sở dữ liệu', 'B202', ''),
(19, 3, 3, '07:00:00', '09:30:00', 'Giải tích 2', 'A102', ''),
(20, 3, 4, '09:30:00', '11:30:00', 'Kỹ thuật lập trình', 'Lab3', ''),
(21, 3, 4, '13:30:00', '16:00:00', 'Tiếng Anh B1', 'D404', ''),
(22, 3, 5, '07:00:00', '09:30:00', 'Mạng máy tính', 'B301', ''),
(23, 3, 6, '13:30:00', '16:00:00', 'Lập trình Web', 'Lab1', ''),
(24, 3, 7, '07:00:00', '10:00:00', 'Thể dục', 'Nhà thi đấu', ''),
(25, 4, 2, '07:00:00', '09:30:00', 'Lập trình hướng đối tượng', 'A101', ''),
(26, 4, 2, '13:30:00', '16:00:00', 'Cơ sở dữ liệu', 'B202', ''),
(27, 4, 3, '07:00:00', '09:30:00', 'Giải tích 2', 'A102', ''),
(28, 4, 4, '09:30:00', '11:30:00', 'Kỹ thuật lập trình', 'Lab3', ''),
(29, 4, 4, '13:30:00', '16:00:00', 'Tiếng Anh B1', 'D404', ''),
(30, 4, 5, '07:00:00', '09:30:00', 'Mạng máy tính', 'B301', ''),
(31, 4, 6, '13:30:00', '16:00:00', 'Lập trình Web', 'Lab1', ''),
(32, 4, 7, '07:00:00', '10:00:00', 'Thể dục', 'Nhà thi đấu', ''),
(41, 1, 2, '07:00:00', '09:30:00', 'Lập trình hướng đối tượng', 'A101', ''),
(42, 1, 2, '13:30:00', '16:00:00', 'Cơ sở dữ liệu', 'B202', ''),
(43, 1, 3, '07:00:00', '09:30:00', 'Giải tích 2', 'A102', ''),
(44, 1, 4, '09:30:00', '11:30:00', 'Kỹ thuật lập trình', 'Lab3', ''),
(45, 1, 4, '13:30:00', '16:00:00', 'Tiếng Anh B1', 'D404', ''),
(46, 1, 5, '07:00:00', '09:30:00', 'Mạng máy tính', 'B301', ''),
(47, 1, 6, '13:30:00', '16:00:00', 'Lập trình Web', 'Lab1', ''),
(48, 1, 7, '07:00:00', '10:00:00', 'Thể dục', 'Nhà thi đấu', '');

-- --------------------------------------------------------

--
-- Table structure for table `lich_ranh`
--

CREATE TABLE `lich_ranh` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `thu` tinyint NOT NULL,
  `gio_bat_dau` time NOT NULL,
  `gio_ket_thuc` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lich_su_hoan_tien`
--

CREATE TABLE `lich_su_hoan_tien` (
  `id` int NOT NULL,
  `khieu_nai_id` int DEFAULT NULL,
  `bao_dam_id` int DEFAULT NULL,
  `nguoi_nhan_loai` enum('sinh_vien','nha_tuyen_dung') NOT NULL,
  `nguoi_nhan_id` int NOT NULL,
  `so_tien` decimal(14,2) NOT NULL,
  `ly_do` text,
  `admin_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mau_tin_viec`
--

CREATE TABLE `mau_tin_viec` (
  `id` int NOT NULL,
  `nhom_viec_id` int DEFAULT NULL,
  `ten_mau` varchar(100) DEFAULT NULL,
  `tieu_de_goi_y` varchar(200) DEFAULT NULL,
  `mo_ta_goi_y` text,
  `ky_nang_goi_y` varchar(300) DEFAULT NULL,
  `luong_min` decimal(12,2) DEFAULT NULL,
  `luong_max` decimal(12,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `mau_tin_viec`
--

INSERT INTO `mau_tin_viec` (`id`, `nhom_viec_id`, `ten_mau`, `tieu_de_goi_y`, `mo_ta_goi_y`, `ky_nang_goi_y`, `luong_min`, `luong_max`) VALUES
(1, 1, 'Gia sư - Dạy kèm', 'Gia sư môn [MÔN] lớp [LỚP]', 'Dạy kèm cho học sinh lớp [LỚP], 2 buổi/tuần', 'Sư phạm, Giao tiếp', 1000000.00, 2500000.00),
(2, 2, 'F&B - Phục vụ', 'Nhân viên phục vụ ca [CA]', 'Phục vụ quán cafe, order, dọn dẹp', 'Giao tiếp', 800000.00, 1500000.00),
(3, 3, 'IT - Frontend', 'Thực tập sinh Frontend Developer', 'Xây dựng giao diện web', 'HTML, CSS, JavaScript, React', 2000000.00, 4000000.00),
(4, 3, 'IT - Backend', 'Backend PHP Laravel Part-time', 'Xây dựng API cho hệ thống quản lý', 'PHP, MySQL, Laravel', 1500000.00, 3000000.00),
(5, 4, 'Designer', 'Designer làm poster/social', 'Thiết kế ấn phẩm truyền thông cho shop', 'Photoshop, Illustrator, Canva', 1500000.00, 3500000.00),
(6, 5, 'Content Marketing', 'Content Marketing Part-time', 'Viết bài cho fanpage, blog', 'Content, SEO, Facebook Ads', 1500000.00, 3000000.00),
(7, 6, 'Sale Online', 'Nhân viên bán hàng online', 'Trả lời tin nhắn, chốt đơn', 'Bán hàng, Giao tiếp', 1200000.00, 2500000.00);

-- --------------------------------------------------------

--
-- Table structure for table `nhat_ky_admin`
--

CREATE TABLE `nhat_ky_admin` (
  `id` int NOT NULL,
  `admin_id` int NOT NULL,
  `hanh_dong` varchar(100) NOT NULL,
  `doi_tuong_loai` varchar(50) DEFAULT NULL,
  `doi_tuong_id` int DEFAULT NULL,
  `chi_tiet` text,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `nhat_ky_admin`
--

INSERT INTO `nhat_ky_admin` (`id`, `admin_id`, `hanh_dong`, `doi_tuong_loai`, `doi_tuong_id`, `chi_tiet`, `ip`, `created_at`) VALUES
(1, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-17 13:42:27'),
(2, 1, 'logout', NULL, NULL, NULL, '::1', '2026-09-17 13:44:49'),
(3, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-17 13:44:57'),
(4, 1, 'auto_scan', NULL, NULL, 'Chặn: 0, Cảnh báo: 0, An toàn: 8', '::1', '2026-09-17 13:46:40'),
(5, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-17 14:03:03'),
(6, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 00:27:56'),
(7, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 08:20:30'),
(8, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 09:33:32'),
(9, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 09:35:49'),
(10, 1, 'lock_user', 'sinh_vien', 5, 'sử dụng thẻ giả', '::1', '2026-09-18 09:36:06'),
(11, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 09:36:40'),
(12, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 09:39:44'),
(13, 1, 'auto_scan', NULL, NULL, 'Chặn: 0, Cảnh báo: 0, An toàn: 12', '::1', '2026-09-18 09:40:02'),
(14, 1, 'approve_job', 'viec_lam', 31, '', '::1', '2026-09-18 09:40:16'),
(15, 1, 'auto_scan', NULL, NULL, 'Chặn: 0, Cảnh báo: 0, An toàn: 0', '::1', '2026-09-18 09:40:18'),
(16, 1, 'add_sv_truong', 'sv_truong', 7, '1905240400', '::1', '2026-09-18 09:42:24'),
(17, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 09:43:40'),
(18, 1, 'logout', NULL, NULL, NULL, '::1', '2026-09-18 09:45:09'),
(19, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-18 14:35:26'),
(20, 1, 'auto_verify_batch', NULL, NULL, 'Duyệt tự động: 0 thành công, 0 thất bại', '::1', '2026-09-18 14:44:59'),
(21, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-20 01:31:18'),
(22, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-20 11:24:42'),
(23, 1, 'logout', NULL, NULL, NULL, '::1', '2026-09-20 11:24:52'),
(24, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-23 01:20:58'),
(25, 1, 'logout', NULL, NULL, NULL, '::1', '2026-09-23 01:22:07'),
(26, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-23 02:51:54'),
(27, 1, 'login', 'quan_tri_vien', 1, 'Đăng nhập hệ thống', '::1', '2026-09-27 12:16:37'),
(28, 1, 'logout', NULL, NULL, NULL, '::1', '2026-09-27 12:16:41');

-- --------------------------------------------------------

--
-- Table structure for table `nha_tuyen_dung`
--

CREATE TABLE `nha_tuyen_dung` (
  `id` int NOT NULL,
  `ten_cong_ty` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `loai` enum('ca_nhan','ho_kinh_doanh','doanh_nghiep') COLLATE utf8mb4_unicode_ci DEFAULT 'doanh_nghiep',
  `cccd` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_so_thue` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nguoi_dai_dien` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dia_chi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vi_do` decimal(10,7) DEFAULT NULL,
  `kinh_do` decimal(10,7) DEFAULT NULL,
  `trang_thai_xac_thuc` enum('chua','dang_cho','da_xac_thuc') COLLATE utf8mb4_unicode_ci DEFAULT 'chua',
  `so_du` decimal(14,2) DEFAULT '0.00',
  `reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `linh_vuc` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ma_so_hkd` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_tin_da_dang` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nha_tuyen_dung`
--

INSERT INTO `nha_tuyen_dung` (`id`, `ten_cong_ty`, `email`, `mat_khau`, `loai`, `cccd`, `ma_so_thue`, `nguoi_dai_dien`, `so_dien_thoai`, `dia_chi`, `vi_do`, `kinh_do`, `trang_thai_xac_thuc`, `so_du`, `reset_token`, `reset_expires`, `linh_vuc`, `mo_ta`, `logo`, `created_at`, `ma_so_hkd`, `website`, `so_tin_da_dang`) VALUES
(1, 'Công ty TNHH ABC Tech', 'hr@abctech.vn', '$2y$10$o063IgDljmRmjfFT64swxuTsE.0DoYQ5qpZKeNW7IUt59R79wUQtC', 'doanh_nghiep', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'chua', 0.00, NULL, NULL, 'Công nghệ thông tin', 'Chuyên phát triển phần mềm và gia công web/app', NULL, '2026-09-15 14:35:10', NULL, NULL, 0),
(2, 'Studio Thiết kế Sáng Tạo', 'tuyendung@sangtao.vn', '$2y$10$o063IgDljmRmjfFT64swxuTsE.0DoYQ5qpZKeNW7IUt59R79wUQtC', 'doanh_nghiep', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'chua', 0.00, NULL, NULL, 'Thiết kế đồ hoạ', 'Nhận thiết kế branding, ấn phẩm truyền thông', NULL, '2026-09-15 14:35:10', NULL, NULL, 0),
(3, 'Trung tâm Ngoại ngữ Viva', 'hr@viva.edu.vn', '$2y$10$o063IgDljmRmjfFT64swxuTsE.0DoYQ5qpZKeNW7IUt59R79wUQtC', 'doanh_nghiep', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'chua', 0.00, NULL, NULL, 'Giáo dục', 'Đào tạo tiếng Anh cho trẻ em và người đi làm', NULL, '2026-09-15 14:35:10', NULL, NULL, 0),
(4, 'demo', 'demo@gmail.com', '$2y$10$MSwRp2VGmBAx.kt8K1jFmOxUWzblE23BDTkqX4LsTUKXTLnREsDBu', 'ca_nhan', '098765432109', NULL, 'Nguyễn Văn A', '0987654321', '107, nguyễn viết xuân, trường vinh, nghệ an', NULL, NULL, 'chua', 0.00, NULL, NULL, NULL, NULL, NULL, '2026-09-16 14:50:24', NULL, NULL, 8),
(5, 'CONG TY TNHH DU LICH TUAN', 'demo1@gmail.com', '$2y$10$b.OMGNFRVXtnbHxI7ii8suROwMXvfzEBmvqwBW9SLKYVJFgXgOcfC', 'doanh_nghiep', '', '0101657909', 'Nguyễn Văn A', '0987654321', '107, nguyễn viết xuân, trường vinh, nghệ an', NULL, NULL, 'da_xac_thuc', 0.00, NULL, NULL, 'Công nghệ thông tin', '', NULL, '2026-09-16 16:13:37', '', '', 1),
(6, 'Design Hoàng Hà', 'hoanghadesign@gmail.com', '$2y$10$HUPEegYkfrp22dZ7uBgorepXsmJEpjq9De/kT0ikDP/4FS8qNnHPu', 'doanh_nghiep', NULL, '0101657987', 'Hoàng Văn Hà', '0987654321', '88-Trương Công Giai-Cầu Giấy-Hà Nội', NULL, NULL, 'chua', 0.00, NULL, NULL, 'Công nghệ thông tin', NULL, NULL, '2026-09-17 14:33:52', NULL, NULL, 3),
(7, 'ABC Banner', 'ABC@gmail.com', '$2y$10$HnetREiCAexBqXmx9AjWm.46AKfYJgVewh8F8bwa3kWg2HtJv4ylC', 'doanh_nghiep', NULL, '09825367211', 'Nguyễn Hoài Đức', '0987123456', '108, Lê Đức Thọ, Mỹ Đình 2, Hà Nội', NULL, NULL, 'chua', 0.00, NULL, NULL, 'Thiết kế đồ họa', NULL, NULL, '2026-09-17 15:29:41', NULL, NULL, 2),
(8, 'Test-Fix', 'testfix@gmail.com', '$2y$10$wMQphUw0t7GTeHNaZctYb.QLDTNZPTER1pFnGG.ZMqlRm6kHnuAbm', 'doanh_nghiep', NULL, '0918277391', 'Lê Hoàng Hiệp', '0987263741', 'Tây Mỗ, Hà Nội', NULL, NULL, 'chua', 0.00, NULL, NULL, 'Công nghệ thông tin', NULL, NULL, '2026-09-17 15:56:47', NULL, NULL, 6),
(9, 'Design', 'design@gmail.com', '$2y$10$7X1M555rTzZBFcMIuX38kOHFXdA.Ih3dgJgjtmHdzlBsO0iOw07XC', 'doanh_nghiep', NULL, '01928374641', 'Nguyễn Thanh Phong', '0987615243', 'Tây Hồ, Hà Nội', NULL, NULL, 'chua', 0.00, NULL, NULL, 'Công nghệ thông tin', NULL, NULL, '2026-09-17 16:18:46', NULL, NULL, 7),
(10, 'design', 'sign@gmail.com', '$2y$10$fRN3LlmVOvNuZHLfgUa5COD5Tv87EQrpebywU38Clrnu73RVFC0km', 'doanh_nghiep', NULL, '9172836541', 'Hồ Bá Anh', '0816286285', 'Thanh Xuân, Hà Nội', NULL, NULL, 'chua', 0.00, NULL, NULL, 'Công nghệ thông tin', NULL, NULL, '2026-09-17 16:48:01', NULL, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `nhiem_vu`
--

CREATE TABLE `nhiem_vu` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `viec_lam_id` int DEFAULT NULL,
  `ten_nhiem_vu` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `han_nop` datetime DEFAULT NULL,
  `trang_thai` enum('dang_lam','cho_duyet','hoan_thanh','qua_han') COLLATE utf8mb4_unicode_ci DEFAULT 'dang_lam',
  `file_san_pham` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `file_xem_truoc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nhiem_vu`
--

INSERT INTO `nhiem_vu` (`id`, `sinh_vien_id`, `viec_lam_id`, `ten_nhiem_vu`, `mo_ta`, `han_nop`, `trang_thai`, `file_san_pham`, `created_at`, `file_xem_truoc`) VALUES
(1, 1, NULL, 'Thực tập sinh Frontend Developer', 'Nhiệm vụ từ ứng tuyển đã được duyệt', '2026-09-23 15:06:16', 'dang_lam', NULL, '2026-09-16 15:06:16', NULL),
(2, 1, 9, 'Nhân viên phục vụ ca [CA]', 'Phục vụ quán cafe, order, dọn dẹp', '2026-09-19 23:59:59', 'cho_duyet', 'uploads/sp_1_1789576277_maubaocaobt-LTDD (1).docx', '2026-09-16 16:30:00', NULL),
(3, 1, 10, 'Nhân viên bán hàng online', 'Trả lời tin nhắn, chốt đơn', '2026-09-20 23:59:59', 'hoan_thanh', 'uploads/sp_1_1789607298_checkbox_binhgiang.pdf', '2026-09-17 00:59:03', NULL),
(6, 3, 15, 'Designer làm poster/social', 'Thiết kế ấn phẩm truyền thông cho shop', '2026-09-19 23:59:59', 'cho_duyet', 'uploads/sp_3_1789660390_lich-hoc-mau.csv', '2026-09-17 15:53:01', NULL),
(7, 1, NULL, 'Content Marketing Part-time', 'Viết bài cho fanpage, blog', '2026-09-19 23:59:59', 'dang_lam', NULL, '2026-09-17 16:12:08', NULL),
(11, 1, 29, 'Backend PHP Laravel Part-time', 'Xây dựng API cho hệ thống quản lý', '2026-09-19 23:59:59', 'dang_lam', NULL, '2026-09-17 16:49:11', NULL),
(12, 2, 30, 'Gia sư môn [MÔN] lớp [LỚP]', 'Dạy kèm cho học sinh lớp [LỚP], 2 buổi/tuần', '2026-09-19 23:59:59', 'hoan_thanh', 'uploads/sp_2_1789724281_lich-hoc-mau.csv', '2026-09-18 09:37:48', NULL),
(13, 3, 33, 'Gia sư môn [MÔN] lớp [LỚP]', 'Dạy kèm cho học sinh lớp [LỚP], 2 buổi/tuần', '2026-09-20 23:59:59', 'hoan_thanh', 'uploads/submissions/sp_3_1789740365.pdf', '2026-09-18 13:54:30', 'uploads/previews/pre_1789740365_sp_3_1789740365.pdf'),
(14, 1, 34, 'Thiết kế giao diện website dạy học trực tuyến 🎓', 'Cần tạo UI/UX hiện đại, thân thiện cho học viên và giảng viên;\nsử dụng Figma/Adobe XD, đáp ứng mobile‑first, tích hợp video, bài kiểm tra và hệ thống đăng ký.', '2026-09-21 23:59:59', 'hoan_thanh', 'uploads/submissions/sp_1_1789870343.png', '2026-09-20 02:10:57', 'uploads/previews/pre_1789870343_sp_1_1789870343.png'),
(15, 1, 35, 'Backend PHP Laravel Part-time', 'Xây dựng API cho hệ thống quản lý', '2026-09-22 23:59:59', 'hoan_thanh', 'uploads/submissions/sp_1_1789871241.png', '2026-09-20 02:26:52', 'uploads/previews/pre_1789871241_sp_1_1789871241.png'),
(16, 1, 36, 'Designer làm poster/social', 'Thiết kế ấn phẩm truyền thông cho shop', '2026-09-21 23:59:59', 'hoan_thanh', 'uploads/submissions/sp_1_1789871412.png', '2026-09-20 02:29:23', 'uploads/previews/pre_1789871412_sp_1_1789871412.png');

-- --------------------------------------------------------

--
-- Table structure for table `nhom_viec`
--

CREATE TABLE `nhom_viec` (
  `id` int NOT NULL,
  `ten_nhom` varchar(100) NOT NULL,
  `icon` varchar(10) DEFAULT 0xF09F9381
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `nhom_viec`
--

INSERT INTO `nhom_viec` (`id`, `ten_nhom`, `icon`) VALUES
(1, 'Gia sư - Giáo dục', '📚'),
(2, 'F&B - Phục vụ', '🍔'),
(3, 'IT - Lập trình', '💻'),
(4, 'Thiết kế - Đồ họa', '🎨'),
(5, 'Marketing - Content', '📢'),
(6, 'Bán hàng - Sale', '🛒'),
(7, 'Giao hàng - Vận chuyển', '🛵'),
(8, 'Khác', '📁');

-- --------------------------------------------------------

--
-- Table structure for table `quan_tri_vien`
--

CREATE TABLE `quan_tri_vien` (
  `id` int NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `vai_tro` enum('super_admin','admin','moderator','support') DEFAULT 'admin',
  `trang_thai` enum('hoat_dong','bi_khoa') DEFAULT 'hoat_dong',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `quan_tri_vien`
--

INSERT INTO `quan_tri_vien` (`id`, `ho_ten`, `email`, `mat_khau`, `vai_tro`, `trang_thai`, `reset_token`, `reset_expires`, `last_login`, `created_at`) VALUES
(1, 'Super Admin', 'admin@stujob.vn', '$2y$10$F02fxqihJs97qm7ZQNAFo..3Wg1NqJfOIWHAl2kU3GiQ/IehFguOq', 'super_admin', 'hoat_dong', NULL, NULL, '2026-09-27 19:16:37', '2026-09-17 13:04:59'),
(2, 'Moderator 01', 'mod@stujob.vn', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe1H4Hc9wkGxYw9ZbwzE8L0L9bN8xNjBa', 'moderator', 'hoat_dong', NULL, NULL, NULL, '2026-09-17 13:04:59');

-- --------------------------------------------------------

--
-- Table structure for table `sinh_vien`
--

CREATE TABLE `sinh_vien` (
  `id` int NOT NULL,
  `ma_sinh_vien` varchar(50) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `so_dien_thoai` varchar(20) DEFAULT NULL,
  `truong` varchar(200) DEFAULT NULL,
  `khoa` varchar(100) DEFAULT NULL,
  `chuyen_nganh` varchar(200) DEFAULT NULL,
  `nam_hoc` int DEFAULT NULL,
  `gpa` decimal(3,2) DEFAULT NULL,
  `anh_dai_dien` varchar(255) DEFAULT NULL,
  `mo_ta` text,
  `vi_do` decimal(10,7) DEFAULT NULL,
  `kinh_do` decimal(10,7) DEFAULT NULL,
  `diem_danh_gia` decimal(3,2) DEFAULT '0.00',
  `so_lan_danh_gia` int DEFAULT '0',
  `trang_thai_xac_thuc` enum('chua','dang_cho','da_xac_thuc') DEFAULT 'chua',
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_expires` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `bi_khoa` tinyint DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sinh_vien`
--

INSERT INTO `sinh_vien` (`id`, `ma_sinh_vien`, `ho_ten`, `email`, `mat_khau`, `so_dien_thoai`, `truong`, `khoa`, `chuyen_nganh`, `nam_hoc`, `gpa`, `anh_dai_dien`, `mo_ta`, `vi_do`, `kinh_do`, `diem_danh_gia`, `so_lan_danh_gia`, `trang_thai_xac_thuc`, `reset_token`, `reset_expires`, `created_at`, `bi_khoa`) VALUES
(1, '0987654321', 'Bùi Đình Anh', 'demo@gmail.com', '$2y$10$fZF6LR6kC8hJo8o3W6WiwuAI1b9KKXf4TeMVt.5x9bXEEEM/3305q', '0987654321', 'Đại học Công nghệ Kỹ thuật Vinh', 'Công nghệ thông tin ', 'Công nghệ thông tin', 6, 3.80, NULL, '1. thiết kế website(HTML, Javascript, Note.js) \n2. thiết kế android(Android studio, java)\n3. cơ bản C++, Python, Java', 21.0285110, 105.8048170, 5.00, 1, 'chua', NULL, NULL, '2026-09-15 15:14:26', 0),
(2, '1605210070', 'Hoàng Văn Nhân', 'hoangvannhan@gmail.com', '$2y$10$f9kXiXHmJ8J2Y7V4OFJnb./zf0qPdUCWgq7C36Rum8HtfPZpAWkVS', '0912345678', 'Đại học Công nghệ Kỹ thuật Vinh', 'Thiết kế đồ họa ', 'Thiết kế ảnh, 3D,...', 4, 3.80, NULL, '\n1. có thể thiết kế banner, avt, ...\n', NULL, NULL, 4.00, 1, 'chua', NULL, NULL, '2026-09-17 14:19:39', 0),
(3, '1705220001', 'Trần Văn An', 'tranvanan@gmail.com', '$2y$10$3ZTUikP0kigDz4nbd258ROrF.s8qL9j7turX9wwQSDkAhV/KzA3xy', '0981237654', 'Đại học Công nghệ Kỹ thuật Vinh', 'Công nghệ thông tin ', 'Công nghệ thông tin', 4, 3.20, NULL, '1. Thiết kế website(PHP, MySQL, HTML, Note.js)\n2. Thiết kế App Android(Android Studio, Java)\n3. Cơ bản C++, Java, Python', NULL, NULL, 0.00, 0, 'chua', NULL, NULL, '2026-09-17 14:28:28', 0),
(4, '1305180594', 'Cao Đức Anh Quân', 'anhquan@gmail.com', '$2y$10$TcSub.JF2q7hFVAti.6XreNs/0XdMr8vI3c8kvWUPMFCM2nllwbre', '0981726354', 'Đại học Công nghệ Kỹ thuật Vinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, 'chua', NULL, NULL, '2026-09-17 15:54:28', 0),
(5, '1905240483', 'Hồ Bá Anh', 'hobaanh@gmail.com', '$2y$10$e4iJtlAMutZbWN0gPgkQJu47znaHaq.i.j/N.Np7yov.dY4/XKz56', '0972573861', 'TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT VINH', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, 'chua', NULL, NULL, '2026-09-18 09:35:28', 1),
(6, '1905240400', 'Trần Trung Hiếu', 'trantrunghieu@gmail.com', '$2y$10$o5IWbB1nnTZSVeYJn72E6OznNYmOFr1BkYjQqIhec404wU5.6WTiW', '0987654321', 'Đại học Công nghệ Kỹ thuật Vinh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, 'chua', NULL, NULL, '2026-09-18 09:43:31', 0);

-- --------------------------------------------------------

--
-- Table structure for table `sv_truong`
--

CREATE TABLE `sv_truong` (
  `id` int NOT NULL,
  `ma_sinh_vien` varchar(50) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `khoa` varchar(100) DEFAULT NULL,
  `chuyen_nganh` varchar(200) DEFAULT NULL,
  `nam_hoc` int DEFAULT NULL,
  `lop` varchar(50) DEFAULT NULL,
  `trang_thai` enum('dang_hoc','tot_nghiep','bi_dinh_chi') DEFAULT 'dang_hoc',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sv_truong`
--

INSERT INTO `sv_truong` (`id`, `ma_sinh_vien`, `ho_ten`, `ngay_sinh`, `khoa`, `chuyen_nganh`, `nam_hoc`, `lop`, `trang_thai`, `created_at`) VALUES
(1, '0987654321', 'Bùi Đình Anh', '2004-05-15', 'Công nghệ thông tin', 'Công nghệ thông tin', 3, 'KTPM01', 'dang_hoc', '2026-09-17 13:04:59'),
(2, 'SV001', 'Nguyễn Văn A', '2004-01-10', 'Công nghệ thông tin', 'Kỹ thuật phần mềm', 3, 'KTPM01', 'dang_hoc', '2026-09-17 13:04:59'),
(3, 'SV002', 'Trần Thị B', '2003-08-22', 'Kinh tế', 'Marketing', 4, 'MKT02', 'dang_hoc', '2026-09-17 13:04:59'),
(4, 'SV003', 'Lê Văn C', '2004-03-12', 'Ngoại ngữ', 'Tiếng Anh', 2, 'TA01', 'dang_hoc', '2026-09-17 13:04:59'),
(5, 'SV004', 'Phạm Thị D', '2003-11-05', 'Công nghệ thông tin', 'Khoa học dữ liệu', 4, 'KHDL01', 'dang_hoc', '2026-09-17 13:04:59'),
(6, 'SV005', 'Hoàng Văn E', '2002-06-18', 'Kinh tế', 'Kế toán', 4, 'KT01', 'tot_nghiep', '2026-09-17 13:04:59'),
(7, '1905240400', 'Trần Trung Hiếu', '2006-09-20', 'Công nghệ thông tin', 'Công nghệ thông tin', NULL, 'DHOTOCK19A1', 'dang_hoc', '2026-09-18 09:42:24');

-- --------------------------------------------------------

--
-- Table structure for table `thong_bao`
--

CREATE TABLE `thong_bao` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `tieu_de` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `loai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `da_doc` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `thong_bao`
--

INSERT INTO `thong_bao` (`id`, `sinh_vien_id`, `tieu_de`, `noi_dung`, `loai`, `da_doc`, `created_at`) VALUES
(1, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-15 15:26:07'),
(2, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-15 15:26:35'),
(3, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-16 15:05:44'),
(4, 1, 'Ứng tuyển được chấp nhận', 'Chúc mừng! Bạn đã được duyệt cho công việc: Thực tập sinh Frontend Developer. Bạn có thể chat với nhà tuyển dụng.', 'success', 1, '2026-09-16 15:06:16'),
(5, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-16 16:24:02'),
(6, 1, 'Ứng tuyển được chấp nhận', 'Bạn đã được duyệt cho công việc: Nhân viên phục vụ ca [CA]. Bạn có thể chat với NTD.', 'success', 1, '2026-09-16 16:30:00'),
(7, 1, 'Bảo đảm thanh toán đã kích hoạt', 'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow', 1, '2026-09-16 16:32:15'),
(8, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-17 00:58:20'),
(9, 1, 'Ứng tuyển được chấp nhận', 'Bạn đã được duyệt cho công việc: Nhân viên bán hàng online. Bạn có thể chat với NTD.', 'success', 1, '2026-09-17 00:59:03'),
(10, 1, 'Bảo đảm thanh toán đã kích hoạt', 'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow', 1, '2026-09-17 01:00:05'),
(11, 1, 'Lời mời giao việc', 'Bạn được mời làm: Backend PHP Laravel Part-time', 'info', 1, '2026-09-17 14:45:13'),
(12, 1, 'Lời mời giao việc', 'Bạn được mời làm: Thực tập sinh Frontend Developer', 'info', 1, '2026-09-17 15:05:04'),
(13, 1, 'Lời mời giao việc', 'Bạn được mời làm: Thực tập sinh Frontend Developer', 'info', 1, '2026-09-17 15:06:24'),
(14, 3, 'Lời mời giao việc', 'Bạn được mời làm: Thực tập sinh Frontend Developer', 'info', 1, '2026-09-17 15:10:08'),
(15, 3, 'Lời mời giao việc', 'Bạn được mời làm: Designer làm poster/social', 'info', 1, '2026-09-17 15:32:44'),
(16, 2, 'Lời mời giao việc', 'Bạn được mời làm: Designer làm poster/social', 'info', 1, '2026-09-17 15:35:44'),
(17, 1, 'Lời mời giao việc', 'Bạn được mời làm: Designer làm poster/social', 'info', 1, '2026-09-17 15:36:59'),
(18, 3, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Designer làm poster/social. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-17 15:48:49'),
(19, 3, 'Bạn đã chấp nhận lời mời', 'Hãy liên hệ NTD đểs trao đổi chi tiết công việc.', 'success', 1, '2026-09-17 15:53:01'),
(20, 1, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Content Marketing Part-time. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-17 16:06:48'),
(21, 1, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Content Marketing Part-time. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-17 16:11:12'),
(22, 1, 'Bạn đã chấp nhận lời mời', 'Hãy liên hệ NTD đểs trao đổi chi tiết công việc.', 'success', 1, '2026-09-17 16:12:08'),
(23, 1, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Content Marketing Part-time. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-17 16:22:11'),
(24, 1, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Content Marketing Part-time. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-17 16:28:11'),
(25, 1, 'Bạn đã chấp nhận lời mời', 'Hãy liên hệ NTD đểs trao đổi chi tiết công việc.', 'success', 1, '2026-09-17 16:28:59'),
(26, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-17 16:37:36'),
(27, 1, 'Ứng tuyển được chấp nhận', 'Bạn đã được duyệt cho công việc: Thực tập sinh Frontend Developer. Bạn có thể chat với NTD.', 'success', 1, '2026-09-17 16:37:52'),
(28, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-17 16:39:36'),
(29, 1, 'Ứng tuyển được chấp nhận', 'Bạn đã được duyệt cho công việc: Backend PHP Laravel Part-time. Bạn có thể chat với NTD.', 'success', 1, '2026-09-17 16:39:54'),
(30, 1, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-17 16:48:55'),
(31, 1, 'Ứng tuyển được chấp nhận', 'Bạn đã được duyệt cho công việc: Backend PHP Laravel Part-time. Bạn có thể chat với NTD.', 'success', 1, '2026-09-17 16:49:11'),
(32, 2, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-18 08:39:59'),
(33, 2, 'Ứng tuyển được chấp nhận', 'Bạn đã được duyệt cho công việc: Gia sư môn [MÔN] lớp [LỚP]. Bạn có thể chat với NTD.', 'success', 0, '2026-09-18 09:37:48'),
(34, 2, 'Bảo đảm thanh toán đã kích hoạt', 'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow', 0, '2026-09-18 09:38:32'),
(35, 2, 'Bài nộp đã được nghiệm thu', 'Bạn đã nhận thù lao. ', 'success', 0, '2026-09-18 09:38:37'),
(36, 2, 'Bạn nhận được đánh giá mới', 'Điểm: 4/5. ', 'info', 0, '2026-09-18 12:17:33'),
(37, 1, 'Bài nộp đã được nghiệm thu', 'Bạn đã nhận thù lao. ', 'success', 1, '2026-09-18 12:17:39'),
(38, 1, 'Bạn nhận được đánh giá mới', 'Điểm: 5/5. ', 'info', 1, '2026-09-18 12:17:45'),
(39, 1, '💸 Rút tiền thành công', 'Đã rút 100,000đ về BIDV - 0977628192123422 (giả lập).', 'success', 1, '2026-09-18 12:57:59'),
(40, 3, 'Ứng tuyển thành công', 'Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.', 'success', 1, '2026-09-18 13:54:11'),
(41, 3, 'Ứng tuyển được chấp nhận', 'Bạn đã được duyệt cho công việc: Gia sư môn [MÔN] lớp [LỚP]. Bạn có thể chat với NTD.', 'success', 1, '2026-09-18 13:54:30'),
(42, 3, 'Bảo đảm thanh toán đã kích hoạt', 'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow', 1, '2026-09-18 13:55:31'),
(43, 3, 'Bài nộp cần chỉnh sửa', 'Hãy chỉnh sửa lại 1 số phần', 'info', 1, '2026-09-18 14:27:26'),
(44, 1, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Thiết kế giao diện website dạy học trực tuyến 🎓. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-20 02:10:48'),
(45, 1, 'Bạn đã chấp nhận lời mời', 'Hãy liên hệ NTD đểs trao đổi chi tiết công việc.', 'success', 1, '2026-09-20 02:10:57'),
(46, 1, 'Bảo đảm thanh toán đã kích hoạt', 'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow', 1, '2026-09-20 02:11:23'),
(47, 1, '✅ Bài nộp đã được nghiệm thu', 'Bạn đã nhận 5,000,000đ từ nghiệm thu: Thiết kế giao diện website dạy học trực tuyến 🎓. Bạn còn 8 đơn miễn phí trước khi áp dụng phí 3%.', 'success', 1, '2026-09-20 02:14:02'),
(48, 1, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Backend PHP Laravel Part-time. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-20 02:26:45'),
(49, 1, 'Bạn đã chấp nhận lời mời', 'Hãy liên hệ NTD đểs trao đổi chi tiết công việc.', 'success', 1, '2026-09-20 02:26:52'),
(50, 1, '✅ Bài nộp đã được nghiệm thu', 'Bạn đã nhận 0đ từ nghiệm thu: Backend PHP Laravel Part-time. Bạn còn 10 đơn miễn phí trước khi áp dụng phí 3%.', 'success', 1, '2026-09-20 02:27:38'),
(51, 3, '✅ Bài nộp đã được nghiệm thu', 'Bạn đã nhận 1,000,000đ từ nghiệm thu: Gia sư môn [MÔN] lớp [LỚP]. Bạn còn 9 đơn miễn phí trước khi áp dụng phí 3%.', 'success', 0, '2026-09-20 02:27:47'),
(52, 1, 'Bảo đảm thanh toán đã kích hoạt', 'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow', 1, '2026-09-20 02:28:15'),
(53, 1, '📬 Bạn có lời mời làm việc mới', 'NTD đã mời bạn làm: Designer làm poster/social. Vào mục \"Lời mời\" để xem chi tiết.', 'invitation', 1, '2026-09-20 02:29:18'),
(54, 1, 'Bạn đã chấp nhận lời mời', 'Hãy liên hệ NTD đểs trao đổi chi tiết công việc.', 'success', 1, '2026-09-20 02:29:23'),
(55, 1, 'Bảo đảm thanh toán đã kích hoạt', 'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow', 1, '2026-09-20 02:29:43'),
(56, 1, '✅ Bài nộp đã được nghiệm thu', 'Bạn đã nhận 2,000,000đ từ nghiệm thu: Designer làm poster/social. Bạn còn 6 đơn miễn phí trước khi áp dụng phí 3%.', 'success', 1, '2026-09-20 02:30:32');

-- --------------------------------------------------------

--
-- Table structure for table `thong_bao_admin`
--

CREATE TABLE `thong_bao_admin` (
  `id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text,
  `loai` varchar(50) DEFAULT 'info',
  `da_doc` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `thong_bao_admin`
--

INSERT INTO `thong_bao_admin` (`id`, `admin_id`, `tieu_de`, `noi_dung`, `loai`, `da_doc`, `created_at`) VALUES
(1, NULL, 'Chào mừng Admin', 'Hệ thống quản trị UniWork đã sẵn sàng.', 'info', 0, '2026-09-17 13:04:59'),
(2, NULL, 'Có tin việc mới cần kiểm duyệt', 'Vào mục Kiểm duyệt để xem danh sách.', 'warning', 0, '2026-09-17 13:04:59');

-- --------------------------------------------------------

--
-- Table structure for table `thong_bao_ntd`
--

CREATE TABLE `thong_bao_ntd` (
  `id` int NOT NULL,
  `nha_tuyen_dung_id` int NOT NULL,
  `tieu_de` varchar(200) NOT NULL,
  `noi_dung` text,
  `loai` varchar(50) DEFAULT 'info',
  `da_doc` tinyint DEFAULT '0',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `thong_bao_ntd`
--

INSERT INTO `thong_bao_ntd` (`id`, `nha_tuyen_dung_id`, `tieu_de`, `noi_dung`, `loai`, `da_doc`, `ngay_tao`) VALUES
(1, 5, 'Nạp ví thành công', 'Đã nạp 100,000đ (giả lập)', 'wallet', 1, '2026-09-16 16:29:32'),
(2, 5, 'Nạp ví thành công', 'Đã nạp 2,000,000đ (giả lập)', 'wallet', 1, '2026-09-16 16:29:48'),
(3, 5, 'Đã duyệt ứng viên', 'Vui lòng nạp tiền vào escrow cho công việc: Nhân viên phục vụ ca [CA]', 'escrow', 1, '2026-09-16 16:30:00'),
(4, 4, 'Đã duyệt ứng viên', 'Vui lòng nạp tiền vào escrow cho công việc: Nhân viên bán hàng online', 'escrow', 1, '2026-09-17 00:59:03'),
(5, 4, 'Nạp ví thành công', 'Đã nạp 2,000,000đ (giả lập)', 'wallet', 1, '2026-09-17 01:00:02'),
(6, 7, 'Sinh viên đã chấp nhận lời mời', 'Sinh viên đã đồng ý làm việc \"Designer làm poster/social\". Vui lòng ký quỹ escrow.', 'success', 1, '2026-09-17 15:53:01'),
(7, 8, 'Sinh viên đã chấp nhận lời mời', 'Sinh viên đã đồng ý làm việc \"Content Marketing Part-time\". Vui lòng ký quỹ escrow.', 'success', 0, '2026-09-17 16:12:08'),
(8, 9, 'Sinh viên đã chấp nhận lời mời', 'Sinh viên đã đồng ý làm việc \"Content Marketing Part-time\". Vui lòng ký quỹ escrow.', 'success', 1, '2026-09-17 16:28:59'),
(9, 9, 'Đã duyệt ứng viên', 'Vui lòng nạp tiền vào escrow cho công việc: Thực tập sinh Frontend Developer', 'escrow', 1, '2026-09-17 16:37:52'),
(10, 9, 'Đã duyệt ứng viên', 'Vui lòng nạp tiền vào escrow cho công việc: Backend PHP Laravel Part-time', 'escrow', 1, '2026-09-17 16:39:54'),
(11, 9, 'Nạp ví thành công', 'Đã nạp 2,000,000đ (giả lập)', 'wallet', 1, '2026-09-17 16:43:01'),
(12, 10, 'Đã duyệt ứng viên', 'Vui lòng nạp tiền vào escrow cho công việc: Backend PHP Laravel Part-time', 'escrow', 0, '2026-09-17 16:49:11'),
(13, 4, 'Đã duyệt ứng viên', 'Vui lòng nạp tiền vào escrow cho công việc: Gia sư môn [MÔN] lớp [LỚP]', 'escrow', 1, '2026-09-18 09:37:48'),
(14, 4, 'Nạp ví thành công', 'Đã nạp 700,000đ (giả lập)', 'wallet', 1, '2026-09-18 09:38:30'),
(15, 4, 'Tin việc đã được duyệt', 'Tin \"Designer làm poster/social\" đã được admin phê duyệt.', 'success', 1, '2026-09-18 09:40:16'),
(16, 4, 'Đã duyệt ứng viên', 'Vui lòng nạp tiền vào escrow cho công việc: Gia sư môn [MÔN] lớp [LỚP]', 'escrow', 1, '2026-09-18 13:54:30'),
(17, 4, 'Nạp ví thành công', 'Đã nạp 1,000,000đ (giả lập)', 'wallet', 1, '2026-09-18 13:55:27'),
(18, 4, 'Sinh viên đã chấp nhận lời mời', 'Sinh viên đã đồng ý làm việc \"Thiết kế giao diện website dạy học trực tuyến 🎓\". Vui lòng ký quỹ escrow.', 'success', 1, '2026-09-20 02:10:57'),
(19, 4, 'Nạp ví thành công', 'Đã nạp 5,000,000đ (giả lập)', 'wallet', 1, '2026-09-20 02:11:08'),
(20, 4, 'Nạp ví thành công', 'Đã nạp 500,000đ (giả lập)', 'wallet', 1, '2026-09-20 02:11:20'),
(21, 4, 'Sinh viên đã chấp nhận lời mời', 'Sinh viên đã đồng ý làm việc \"Backend PHP Laravel Part-time\". Vui lòng ký quỹ escrow.', 'success', 1, '2026-09-20 02:26:52'),
(22, 4, 'Nạp ví thành công', 'Đã nạp 5,000,000đ (giả lập)', 'wallet', 1, '2026-09-20 02:28:13'),
(23, 4, 'Sinh viên đã chấp nhận lời mời', 'Sinh viên đã đồng ý làm việc \"Designer làm poster/social\". Vui lòng ký quỹ escrow.', 'success', 1, '2026-09-20 02:29:23');

-- --------------------------------------------------------

--
-- Table structure for table `tin_nhan`
--

CREATE TABLE `tin_nhan` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `nha_tuyen_dung_id` int NOT NULL,
  `nguoi_gui` enum('sinh_vien','nha_tuyen_dung') COLLATE utf8mb4_unicode_ci NOT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `da_doc` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tin_nhan`
--

INSERT INTO `tin_nhan` (`id`, `sinh_vien_id`, `nha_tuyen_dung_id`, `nguoi_gui`, `noi_dung`, `da_doc`, `created_at`) VALUES
(1, 1, 1, 'sinh_vien', '.', 0, '2026-09-16 09:07:38'),
(2, 1, 1, 'nha_tuyen_dung', 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ xem xét hồ sơ của bạn trong thời gian sớm nhất.', 1, '2026-09-16 09:07:38'),
(3, 1, 2, 'sinh_vien', 'alo', 0, '2026-09-16 09:08:08'),
(4, 1, 2, 'nha_tuyen_dung', 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ xem xét hồ sơ của bạn trong thời gian sớm nhất.', 1, '2026-09-16 09:08:08'),
(5, 1, 5, 'sinh_vien', 'alo', 1, '2026-09-17 00:59:18'),
(6, 1, 5, 'nha_tuyen_dung', 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.', 1, '2026-09-17 00:59:18'),
(7, 1, 5, 'sinh_vien', 'xin chào', 1, '2026-09-17 01:00:13'),
(8, 1, 5, 'nha_tuyen_dung', 'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.', 1, '2026-09-17 01:00:13'),
(9, 1, 4, 'nha_tuyen_dung', 'alo', 1, '2026-09-17 01:10:20'),
(10, 1, 4, 'sinh_vien', 'lo', 1, '2026-09-17 01:10:36'),
(11, 1, 4, 'nha_tuyen_dung', 'Bạn có thể gửi thêm portfolio để chúng tôi tham khảo nhé.', 1, '2026-09-17 01:10:36'),
(12, 1, 9, 'sinh_vien', 'xin chào', 1, '2026-09-17 16:41:51'),
(13, 1, 9, 'nha_tuyen_dung', 'Bạn có thể gửi thêm portfolio để chúng tôi tham khảo nhé.', 1, '2026-09-17 16:41:51'),
(14, 1, 9, 'nha_tuyen_dung', 'chào bạn', 1, '2026-09-17 16:41:59');

-- --------------------------------------------------------

--
-- Table structure for table `tu_khoa_cam`
--

CREATE TABLE `tu_khoa_cam` (
  `id` int NOT NULL,
  `tu_khoa` varchar(100) NOT NULL,
  `muc_do_rui_ro` int DEFAULT '5',
  `hanh_dong` enum('chan','canh_bao') DEFAULT 'chan',
  `ghi_chu` text,
  `loai` enum('lua_dao','rui_ro','khong_phu_hop') DEFAULT 'rui_ro',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tu_khoa_cam`
--

INSERT INTO `tu_khoa_cam` (`id`, `tu_khoa`, `muc_do_rui_ro`, `hanh_dong`, `ghi_chu`, `loai`, `created_at`) VALUES
(1, 'đa cấp', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(2, 'forex', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(3, 'cá độ', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(4, 'casino', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(5, 'xổ số', 9, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(6, 'lô đề', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(7, 'tín dụng đen', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(8, 'vay nóng', 9, 'chan', NULL, 'rui_ro', '2026-09-17 13:04:59'),
(9, 'chứng khoán', 7, 'chan', NULL, 'rui_ro', '2026-09-17 13:04:59'),
(10, 'tiền ảo', 8, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(11, 'bitcoin', 8, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(12, 'crypto', 8, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(13, 'đầu tư sinh lời', 9, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(14, 'hoa hồng cao', 7, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(15, 'nạp tiền', 8, 'chan', NULL, 'rui_ro', '2026-09-17 13:04:59'),
(16, 'đặt cọc', 6, 'chan', NULL, 'rui_ro', '2026-09-17 13:04:59'),
(17, 'thu tiền trước', 7, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(18, 'nội dung người lớn', 10, 'chan', NULL, 'khong_phu_hop', '2026-09-17 13:04:59'),
(19, 'khiêu dâm', 10, 'chan', NULL, 'khong_phu_hop', '2026-09-17 13:04:59'),
(20, 'cờ bạc', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59'),
(21, 'bóng đá', 4, 'chan', NULL, 'rui_ro', '2026-09-17 13:04:59'),
(22, 'mại dâm', 10, 'chan', NULL, 'khong_phu_hop', '2026-09-17 13:04:59'),
(23, 'ma túy', 10, 'chan', NULL, 'khong_phu_hop', '2026-09-17 13:04:59'),
(24, 'rửa tiền', 10, 'chan', NULL, 'lua_dao', '2026-09-17 13:04:59');

-- --------------------------------------------------------

--
-- Table structure for table `ung_tuyen`
--

CREATE TABLE `ung_tuyen` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `viec_lam_id` int NOT NULL,
  `loai` enum('ung_tuyen','loi_moi') COLLATE utf8mb4_unicode_ci DEFAULT 'ung_tuyen',
  `loi_nhan` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` enum('cho_duyet','da_chap_nhan','tu_choi','hoan_thanh') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_duyet',
  `ngay_moi` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ung_tuyen`
--

INSERT INTO `ung_tuyen` (`id`, `sinh_vien_id`, `viec_lam_id`, `loai`, `loi_nhan`, `trang_thai`, `ngay_moi`, `created_at`) VALUES
(1, 1, 1, 'ung_tuyen', '', 'cho_duyet', NULL, '2026-09-15 15:26:07'),
(2, 1, 2, 'ung_tuyen', '', 'cho_duyet', NULL, '2026-09-15 15:26:35'),
(4, 1, 9, 'ung_tuyen', '', 'da_chap_nhan', NULL, '2026-09-16 16:24:02'),
(5, 1, 10, 'ung_tuyen', '', 'hoan_thanh', NULL, '2026-09-17 00:58:20'),
(6, 1, 11, 'ung_tuyen', '', 'cho_duyet', NULL, '2026-09-17 14:45:13'),
(7, 1, 12, 'loi_moi', '', 'cho_duyet', '2026-09-17 15:05:04', '2026-09-17 15:05:04'),
(8, 1, 13, 'loi_moi', '', 'cho_duyet', '2026-09-17 15:06:24', '2026-09-17 15:06:24'),
(9, 3, 12, 'ung_tuyen', '', 'cho_duyet', NULL, '2026-09-17 15:10:08'),
(12, 1, 3, 'loi_moi', 'Chào bạn! Chúng tôi rất ấn tượng với hồ sơ của bạn. Mời bạn tham gia dự án phát triển website. Vui lòng phản hồi sớm để chúng ta trao đổi chi tiết!', 'cho_duyet', '2026-09-17 15:14:00', '2026-09-17 15:14:00'),
(13, 3, 14, 'ung_tuyen', 'demo', 'cho_duyet', NULL, '2026-09-17 15:32:44'),
(14, 2, 14, 'ung_tuyen', '', 'cho_duyet', NULL, '2026-09-17 15:35:44'),
(15, 1, 14, 'loi_moi', '', 'cho_duyet', '2026-09-17 15:36:59', '2026-09-17 15:36:59'),
(16, 3, 15, 'loi_moi', 'mong bạn có phản hồi', 'da_chap_nhan', '2026-09-17 15:48:49', '2026-09-17 15:48:49'),
(19, 1, 22, 'loi_moi', '', 'tu_choi', '2026-09-17 16:22:11', '2026-09-17 16:22:11'),
(20, 1, 23, 'loi_moi', 'demo', 'da_chap_nhan', '2026-09-17 16:28:11', '2026-09-17 16:28:11'),
(23, 1, 29, 'ung_tuyen', '', 'da_chap_nhan', NULL, '2026-09-17 16:48:55'),
(24, 2, 30, 'ung_tuyen', '', 'hoan_thanh', NULL, '2026-09-18 08:39:59'),
(25, 3, 33, 'ung_tuyen', '', 'hoan_thanh', NULL, '2026-09-18 13:54:11'),
(26, 1, 34, 'loi_moi', '', 'hoan_thanh', '2026-09-20 02:10:48', '2026-09-20 02:10:48'),
(27, 1, 35, 'loi_moi', '', 'hoan_thanh', '2026-09-20 02:26:45', '2026-09-20 02:26:45'),
(28, 1, 36, 'loi_moi', '', 'hoan_thanh', '2026-09-20 02:29:18', '2026-09-20 02:29:18');

-- --------------------------------------------------------

--
-- Table structure for table `viec_lam`
--

CREATE TABLE `viec_lam` (
  `id` int NOT NULL,
  `nha_tuyen_dung_id` int NOT NULL,
  `tieu_de` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `yeu_cau` text COLLATE utf8mb4_unicode_ci,
  `ky_nang_can` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thu_lam_viec` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gio_bat_dau` time DEFAULT NULL,
  `gio_ket_thuc` time DEFAULT NULL,
  `luong_min` decimal(12,2) DEFAULT NULL,
  `luong_max` decimal(12,2) DEFAULT NULL,
  `don_vi_luong` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'VNĐ/giờ',
  `han_chot` date DEFAULT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `han_nop_file` date DEFAULT NULL,
  `trang_thai` enum('dang_mo','da_dong') COLLATE utf8mb4_unicode_ci DEFAULT 'dang_mo',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `phi_dich_vu` decimal(12,2) DEFAULT '0.00',
  `loai_cong_viec` enum('remote','onsite','hybrid') COLLATE utf8mb4_unicode_ci DEFAULT 'remote',
  `so_luong_can` int DEFAULT '1',
  `so_buoi` int DEFAULT '1',
  `gio_uoc_tinh` int DEFAULT '0',
  `dia_chi_lam_viec` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nhom_viec_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `viec_lam`
--

INSERT INTO `viec_lam` (`id`, `nha_tuyen_dung_id`, `tieu_de`, `mo_ta`, `yeu_cau`, `ky_nang_can`, `thu_lam_viec`, `gio_bat_dau`, `gio_ket_thuc`, `luong_min`, `luong_max`, `don_vi_luong`, `han_chot`, `ngay_bat_dau`, `ngay_ket_thuc`, `han_nop_file`, `trang_thai`, `created_at`, `phi_dich_vu`, `loai_cong_viec`, `so_luong_can`, `so_buoi`, `gio_uoc_tinh`, `dia_chi_lam_viec`, `nhom_viec_id`) VALUES
(1, 1, 'Thực tập sinh Front-end Developer', 'Xây dựng giao diện web bằng HTML/CSS/JS', 'Biết ReactJS, làm việc nhóm tốt', 'HTML,CSS,JavaScript', '2,4,6', '08:00:00', '12:00:00', 1500000.00, 2500000.00, 'VNĐ/giờ', '2026-10-15', NULL, NULL, NULL, 'dang_mo', '2026-09-15 14:35:10', 0.00, 'remote', 1, 1, 0, NULL, NULL),
(2, 1, 'Backend PHP Laravel Part-time', 'Xây dựng API cho hệ thống quản lý', 'Nắm vững PHP, MySQL', 'PHP,Laravel,MySQL', '3,5', '13:30:00', '17:30:00', 1500000.00, 3000000.00, 'VNĐ/giờ', '2026-10-15', NULL, NULL, NULL, 'dang_mo', '2026-09-15 14:35:10', 0.00, 'remote', 1, 1, 0, NULL, NULL),
(3, 2, 'Designer đồ hoạ bán thời gian', 'Thiết kế poster, social media', 'Thành thạo Photoshop, Illustrator', 'Photoshop,Illustrator,Canva', '2,3,5', '18:00:00', '21:00:00', 1000000.00, 2000000.00, 'VNĐ/giờ', '2026-10-15', NULL, NULL, NULL, 'dang_mo', '2026-09-15 14:35:10', 0.00, 'remote', 1, 1, 0, NULL, NULL),
(4, 2, 'Content Marketing Part-time', 'Viết content cho fanpage, blog', 'Kỹ năng viết tốt, sáng tạo', 'Content,SEO,Mạng xã hội', '2,4,6', '19:00:00', '22:00:00', 800000.00, 1500000.00, 'VNĐ/giờ', '2026-10-15', NULL, NULL, NULL, 'dang_mo', '2026-09-15 14:35:10', 0.00, 'remote', 1, 1, 0, NULL, NULL),
(5, 3, 'Trợ giảng tiếng Anh cuối tuần', 'Hỗ trợ giáo viên chấm bài, điểm danh', 'Tiếng Anh giao tiếp tốt', 'Tiếng Anh,Giao tiếp', '7,8', '08:00:00', '11:00:00', 1000000.00, 1800000.00, 'VNĐ/giờ', '2026-10-15', NULL, NULL, NULL, 'dang_mo', '2026-09-15 14:35:10', 0.00, 'remote', 1, 1, 0, NULL, NULL),
(6, 3, 'Gia sư Toán cho học sinh cấp 3', 'Dạy kèm Toán lớp 10-12', 'Kiến thức Toán vững', 'Toán,Sư phạm', '3,5,7', '19:30:00', '21:30:00', 1200000.00, 2000000.00, 'VNĐ/giờ', '2026-10-15', NULL, NULL, NULL, 'dang_mo', '2026-09-15 14:35:10', 0.00, 'remote', 1, 1, 0, NULL, NULL),
(9, 5, 'Nhân viên phục vụ ca [CA]', 'Phục vụ quán cafe, order, dọn dẹp', NULL, 'Giao tiếp', '', '08:00:00', '12:00:00', 800000.00, 1500000.00, 'VNĐ/giờ', '2026-09-19', NULL, NULL, NULL, 'dang_mo', '2026-09-16 16:22:39', 0.00, 'remote', 1, 1, 0, NULL, 1),
(10, 4, 'Nhân viên bán hàng online', 'Trả lời tin nhắn, chốt đơn', NULL, 'Bán hàng, Giao tiếp', NULL, NULL, NULL, 1500000.00, 1500000.00, 'VNĐ', '2026-09-20', NULL, NULL, NULL, 'dang_mo', '2026-09-17 00:58:01', 0.00, 'remote', 1, 5, 0, '107, nguyễn viết xuân, trường vinh, nghệ an', 6),
(11, 6, 'Backend PHP Laravel Part-time', 'Xây dựng API cho hệ thống quản lý', NULL, 'PHP, MySQL, Laravel', NULL, NULL, NULL, 2000000.00, 2000000.00, 'VNĐ', '2026-09-18', '2026-09-18', '2026-09-20', NULL, 'dang_mo', '2026-09-17 14:45:01', 0.00, 'onsite', 1, 1, 20, '107, nguyễn viết xuân, trường vinh, nghệ an', 3),
(12, 6, 'Thực tập sinh Frontend Developer', 'Xây dựng giao diện web', NULL, 'HTML, CSS, JavaScript, React', NULL, NULL, NULL, 2500000.00, 2500000.00, 'VNĐ', '2026-09-18', '2026-09-18', '2026-09-21', NULL, 'dang_mo', '2026-09-17 15:04:52', 0.00, 'onsite', 1, 5, 20, '107, nguyễn viết xuân, trường vinh, nghệ an', 3),
(13, 6, 'Thực tập sinh Frontend Developer', 'Xây dựng giao diện web', NULL, 'HTML, CSS, JavaScript, React', NULL, NULL, NULL, 2000000.00, 2000000.00, 'VNĐ', '2026-09-20', '2026-09-20', '2026-09-20', NULL, 'dang_mo', '2026-09-17 15:06:19', 0.00, 'onsite', 1, 2, 0, '107, nguyễn viết xuân, trường vinh, nghệ an', 3),
(14, 7, 'Designer làm poster/social', 'Thiết kế ấn phẩm truyền thông cho shop', NULL, 'Photoshop, Illustrator, Canva', NULL, NULL, NULL, 2000000.00, 2000000.00, 'VNĐ', '2026-09-20', '2026-09-20', '2026-09-20', NULL, 'dang_mo', '2026-09-17 15:30:51', 0.00, 'onsite', 1, 2, 8, '107, nguyễn viết xuân, trường vinh, nghệ an', 4),
(15, 7, 'Designer làm poster/social', 'Thiết kế ấn phẩm truyền thông cho shop', NULL, 'Photoshop, Illustrator, Canva', NULL, NULL, NULL, 1500000.00, 1500000.00, 'VNĐ', '2026-09-19', '2026-09-19', '2026-09-20', NULL, 'dang_mo', '2026-09-17 15:48:23', 0.00, 'onsite', 1, 3, 15, '107, nguyễn viết xuân, trường vinh, nghệ an', 4),
(16, 8, 'Content Marketing Part-time', 'Viết bài cho fanpage, blog', NULL, 'Content, SEO, Facebook Ads', NULL, NULL, NULL, 1500000.00, 1500000.00, 'VNĐ', '2026-09-19', '2026-09-19', '2026-09-20', NULL, 'dang_mo', '2026-09-17 15:58:08', 0.00, 'onsite', 1, 3, 15, '107, nguyễn viết xuân, trường vinh, nghệ an', 5),
(21, 8, 'Content Marketing Part-time', 'Viết bài cho fanpage, blog', NULL, 'Facebook Ads', NULL, NULL, NULL, 1500000.00, 1500000.00, 'VNĐ', '2026-09-19', '2026-09-19', '2026-09-20', NULL, 'dang_mo', '2026-09-17 16:16:20', 150000.00, 'onsite', 1, 3, 15, '107, nguyễn viết xuân, trường vinh, nghệ an', 5),
(22, 9, 'Content Marketing Part-time', 'Viết bài cho fanpage, blog', NULL, ' Facebook Ads', NULL, NULL, NULL, 1500000.00, 1500000.00, 'VNĐ', '2026-09-19', '2026-09-19', '2026-09-20', NULL, 'dang_mo', '2026-09-17 16:20:37', 0.00, 'onsite', 1, 3, 15, '107, nguyễn viết xuân, trường vinh, nghệ an', 5),
(23, 9, 'Content Marketing Part-time', 'Viết bài cho fanpage, blog', NULL, ' Facebook Ads', NULL, NULL, NULL, 1500000.00, 1500000.00, 'VNĐ', '2026-09-19', '2026-09-19', '2026-09-20', NULL, 'dang_mo', '2026-09-17 16:27:27', 0.00, 'onsite', 1, 3, 15, '107, nguyễn viết xuân, trường vinh, nghệ an', 5),
(29, 10, 'Backend PHP Laravel Part-time', 'Xây dựng API cho hệ thống quản lý', NULL, 'PHP, MySQL, Laravel', NULL, NULL, NULL, 1800000.00, 1800000.00, 'VNĐ', '2026-09-19', NULL, NULL, NULL, 'dang_mo', '2026-09-17 16:48:39', 0.00, 'remote', 1, 4, 18, '', 3),
(30, 4, 'Gia sư môn [MÔN] lớp [LỚP]', 'Dạy kèm cho học sinh lớp [LỚP], 2 buổi/tuần', NULL, 'Sư phạm, Giao tiếp', NULL, NULL, NULL, 1200000.00, 1200000.00, 'VNĐ', '2026-09-19', NULL, NULL, NULL, 'dang_mo', '2026-09-18 08:39:41', 0.00, 'remote', 1, 4, 12, '', 1),
(31, 4, 'Designer làm poster/social', 'Thiết kế ấn phẩm truyền thông cho shop', NULL, 'Photoshop, Illustrator, Canva', NULL, NULL, NULL, 2000000.00, 2000000.00, 'VNĐ', '2026-09-19', '2026-09-19', '2026-09-20', NULL, 'dang_mo', '2026-09-18 08:43:47', 0.00, 'onsite', 2, 4, 20, '107, nguyễn viết xuân, trường vinh, nghệ an', 4),
(32, 4, 'Xây dựng giao diện', 'Xây dựng giao diện website bán vé điện tử', NULL, 'HTML, CSS, JavaScript, React', NULL, NULL, NULL, 2000000.00, 2000000.00, 'VNĐ', '2026-09-20', '2026-09-20', '2026-09-22', NULL, 'dang_mo', '2026-09-18 12:41:07', 0.00, 'onsite', 1, 1, 0, '228, nguyễn phong sắc, trường vinh, nghệ an', 3),
(33, 4, 'Gia sư môn [MÔN] lớp [LỚP]', 'Dạy kèm cho học sinh lớp [LỚP], 2 buổi/tuần', NULL, 'Sư phạm, Giao tiếp', NULL, NULL, NULL, 1000000.00, 1000000.00, 'VNĐ', '2026-09-20', NULL, NULL, NULL, 'dang_mo', '2026-09-18 13:52:03', 0.00, 'remote', 1, 2, 0, '', 1),
(34, 4, 'Thiết kế giao diện website dạy học trực tuyến 🎓', 'Cần tạo UI/UX hiện đại, thân thiện cho học viên và giảng viên;\nsử dụng Figma/Adobe XD, đáp ứng mobile‑first, tích hợp video, bài kiểm tra và hệ thống đăng ký.', NULL, 'HTML/CSS, React hoặc Vue, hiểu UX cho giáo dục.', NULL, NULL, NULL, 5000000.00, 5000000.00, 'VNĐ', '2026-09-21', NULL, NULL, '2026-09-23', 'dang_mo', '2026-09-20 02:08:22', 500000.00, 'remote', 1, 5, 25, '', 3),
(35, 4, 'Backend PHP Laravel Part-time', 'Xây dựng API cho hệ thống quản lý', NULL, 'PHP, MySQL, Laravel', NULL, NULL, NULL, 2000000.00, 2000000.00, 'VNĐ', '2026-09-22', NULL, NULL, '2026-09-24', 'dang_mo', '2026-09-20 02:26:30', 200000.00, 'remote', 1, 5, 20, '', 3),
(36, 4, 'Designer làm poster/social', 'Thiết kế ấn phẩm truyền thông cho shop', NULL, 'Photoshop, Illustrator, Canva', NULL, NULL, NULL, 2000000.00, 2000000.00, 'VNĐ', '2026-09-21', NULL, NULL, '2026-09-24', 'dang_mo', '2026-09-20 02:29:06', 200000.00, 'remote', 1, 5, 20, '', 4);

-- --------------------------------------------------------

--
-- Table structure for table `vi_ntd`
--

CREATE TABLE `vi_ntd` (
  `nha_tuyen_dung_id` int NOT NULL,
  `so_du` decimal(14,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vi_ntd`
--

INSERT INTO `vi_ntd` (`nha_tuyen_dung_id`, `so_du`) VALUES
(1, 0.00),
(2, 0.00),
(3, 0.00),
(4, 600000.00),
(5, 950000.00),
(6, 0.00),
(7, 0.00),
(8, 0.00),
(9, 2000000.00),
(10, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `vi_tien`
--

CREATE TABLE `vi_tien` (
  `sinh_vien_id` int NOT NULL,
  `so_du` decimal(14,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vi_tien`
--

INSERT INTO `vi_tien` (`sinh_vien_id`, `so_du`) VALUES
(1, 8400000.00),
(2, 1200000.00),
(3, 1000000.00);

-- --------------------------------------------------------

--
-- Table structure for table `yeu_cau_rut_tien`
--

CREATE TABLE `yeu_cau_rut_tien` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `so_tien` decimal(14,2) NOT NULL,
  `ngan_hang` varchar(100) NOT NULL,
  `so_tai_khoan` varchar(50) NOT NULL,
  `chu_tai_khoan` varchar(100) NOT NULL,
  `trang_thai` enum('cho_xu_ly','da_duyet','da_chuyen','tu_choi') DEFAULT 'cho_xu_ly',
  `ghi_chu` varchar(255) DEFAULT NULL,
  `ly_do_tu_choi` varchar(255) DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `yeu_cau_rut_tien`
--

INSERT INTO `yeu_cau_rut_tien` (`id`, `sinh_vien_id`, `so_tien`, `ngan_hang`, `so_tai_khoan`, `chu_tai_khoan`, `trang_thai`, `ghi_chu`, `ly_do_tu_choi`, `admin_id`, `created_at`, `processed_at`) VALUES
(1, 1, 100000.00, 'BIDV', '0977628192123422', 'BUI DINH ANH', 'da_chuyen', 'Giả lập - Rút thành công ngay', NULL, NULL, '2026-09-18 12:57:59', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `yeu_cau_xac_thuc`
--

CREATE TABLE `yeu_cau_xac_thuc` (
  `id` int NOT NULL,
  `sinh_vien_id` int NOT NULL,
  `admin_id` int DEFAULT NULL,
  `trang_thai` enum('cho_duyet','da_xac_thuc','tu_choi') DEFAULT 'cho_duyet',
  `ghi_chu` text,
  `ly_do_tu_choi` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `processed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `bao_dam_thanh_toan`
--
ALTER TABLE `bao_dam_thanh_toan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nha_tuyen_dung_id` (`nha_tuyen_dung_id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `idx_ung_tuyen` (`ung_tuyen_id`);

--
-- Indexes for table `cau_hinh_he_thong`
--
ALTER TABLE `cau_hinh_he_thong`
  ADD PRIMARY KEY (`khoa`);

--
-- Indexes for table `chung_chi`
--
ALTER TABLE `chung_chi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `danh_gia`
--
ALTER TABLE `danh_gia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nha_tuyen_dung_id` (`nha_tuyen_dung_id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `nhiem_vu_id` (`nhiem_vu_id`);

--
-- Indexes for table `giao_dich`
--
ALTER TABLE `giao_dich`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `nhiem_vu_id` (`nhiem_vu_id`);

--
-- Indexes for table `khieu_nai`
--
ALTER TABLE `khieu_nai`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `kiem_duyet_tin`
--
ALTER TABLE `kiem_duyet_tin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `viec_lam_id` (`viec_lam_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `ky_nang`
--
ALTER TABLE `ky_nang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `lich_hoc`
--
ALTER TABLE `lich_hoc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `lich_ranh`
--
ALTER TABLE `lich_ranh`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `lich_su_hoan_tien`
--
ALTER TABLE `lich_su_hoan_tien`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mau_tin_viec`
--
ALTER TABLE `mau_tin_viec`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nhom_viec_id` (`nhom_viec_id`);

--
-- Indexes for table `nhat_ky_admin`
--
ALTER TABLE `nhat_ky_admin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `nha_tuyen_dung`
--
ALTER TABLE `nha_tuyen_dung`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `nhiem_vu`
--
ALTER TABLE `nhiem_vu`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `viec_lam_id` (`viec_lam_id`);

--
-- Indexes for table `nhom_viec`
--
ALTER TABLE `nhom_viec`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `quan_tri_vien`
--
ALTER TABLE `quan_tri_vien`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `sinh_vien`
--
ALTER TABLE `sinh_vien`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_sinh_vien` (`ma_sinh_vien`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `sv_truong`
--
ALTER TABLE `sv_truong`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ma_sinh_vien` (`ma_sinh_vien`);

--
-- Indexes for table `thong_bao`
--
ALTER TABLE `thong_bao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `thong_bao_admin`
--
ALTER TABLE `thong_bao_admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `thong_bao_ntd`
--
ALTER TABLE `thong_bao_ntd`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nha_tuyen_dung_id` (`nha_tuyen_dung_id`);

--
-- Indexes for table `tin_nhan`
--
ALTER TABLE `tin_nhan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `nha_tuyen_dung_id` (`nha_tuyen_dung_id`);

--
-- Indexes for table `tu_khoa_cam`
--
ALTER TABLE `tu_khoa_cam`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ung_tuyen`
--
ALTER TABLE `ung_tuyen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ut` (`sinh_vien_id`,`viec_lam_id`),
  ADD KEY `viec_lam_id` (`viec_lam_id`);

--
-- Indexes for table `viec_lam`
--
ALTER TABLE `viec_lam`
  ADD PRIMARY KEY (`id`),
  ADD KEY `nha_tuyen_dung_id` (`nha_tuyen_dung_id`);

--
-- Indexes for table `vi_ntd`
--
ALTER TABLE `vi_ntd`
  ADD PRIMARY KEY (`nha_tuyen_dung_id`);

--
-- Indexes for table `vi_tien`
--
ALTER TABLE `vi_tien`
  ADD PRIMARY KEY (`sinh_vien_id`);

--
-- Indexes for table `yeu_cau_rut_tien`
--
ALTER TABLE `yeu_cau_rut_tien`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`);

--
-- Indexes for table `yeu_cau_xac_thuc`
--
ALTER TABLE `yeu_cau_xac_thuc`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sinh_vien_id` (`sinh_vien_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bao_dam_thanh_toan`
--
ALTER TABLE `bao_dam_thanh_toan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `chung_chi`
--
ALTER TABLE `chung_chi`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `danh_gia`
--
ALTER TABLE `danh_gia`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `giao_dich`
--
ALTER TABLE `giao_dich`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `khieu_nai`
--
ALTER TABLE `khieu_nai`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kiem_duyet_tin`
--
ALTER TABLE `kiem_duyet_tin`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `ky_nang`
--
ALTER TABLE `ky_nang`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `lich_hoc`
--
ALTER TABLE `lich_hoc`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `lich_ranh`
--
ALTER TABLE `lich_ranh`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lich_su_hoan_tien`
--
ALTER TABLE `lich_su_hoan_tien`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mau_tin_viec`
--
ALTER TABLE `mau_tin_viec`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `nhat_ky_admin`
--
ALTER TABLE `nhat_ky_admin`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `nha_tuyen_dung`
--
ALTER TABLE `nha_tuyen_dung`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `nhiem_vu`
--
ALTER TABLE `nhiem_vu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `nhom_viec`
--
ALTER TABLE `nhom_viec`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `quan_tri_vien`
--
ALTER TABLE `quan_tri_vien`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sinh_vien`
--
ALTER TABLE `sinh_vien`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sv_truong`
--
ALTER TABLE `sv_truong`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `thong_bao`
--
ALTER TABLE `thong_bao`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `thong_bao_admin`
--
ALTER TABLE `thong_bao_admin`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `thong_bao_ntd`
--
ALTER TABLE `thong_bao_ntd`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `tin_nhan`
--
ALTER TABLE `tin_nhan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tu_khoa_cam`
--
ALTER TABLE `tu_khoa_cam`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `ung_tuyen`
--
ALTER TABLE `ung_tuyen`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `viec_lam`
--
ALTER TABLE `viec_lam`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `yeu_cau_rut_tien`
--
ALTER TABLE `yeu_cau_rut_tien`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `yeu_cau_xac_thuc`
--
ALTER TABLE `yeu_cau_xac_thuc`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `bao_dam_thanh_toan`
--
ALTER TABLE `bao_dam_thanh_toan`
  ADD CONSTRAINT `bao_dam_thanh_toan_ibfk_2` FOREIGN KEY (`nha_tuyen_dung_id`) REFERENCES `nha_tuyen_dung` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bao_dam_thanh_toan_ibfk_3` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chung_chi`
--
ALTER TABLE `chung_chi`
  ADD CONSTRAINT `chung_chi_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `danh_gia`
--
ALTER TABLE `danh_gia`
  ADD CONSTRAINT `danh_gia_ibfk_1` FOREIGN KEY (`nha_tuyen_dung_id`) REFERENCES `nha_tuyen_dung` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `danh_gia_ibfk_2` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `danh_gia_ibfk_3` FOREIGN KEY (`nhiem_vu_id`) REFERENCES `nhiem_vu` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `giao_dich`
--
ALTER TABLE `giao_dich`
  ADD CONSTRAINT `giao_dich_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `giao_dich_ibfk_2` FOREIGN KEY (`nhiem_vu_id`) REFERENCES `nhiem_vu` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `khieu_nai`
--
ALTER TABLE `khieu_nai`
  ADD CONSTRAINT `khieu_nai_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `quan_tri_vien` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `kiem_duyet_tin`
--
ALTER TABLE `kiem_duyet_tin`
  ADD CONSTRAINT `kiem_duyet_tin_ibfk_1` FOREIGN KEY (`viec_lam_id`) REFERENCES `viec_lam` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `kiem_duyet_tin_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `quan_tri_vien` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `ky_nang`
--
ALTER TABLE `ky_nang`
  ADD CONSTRAINT `ky_nang_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lich_hoc`
--
ALTER TABLE `lich_hoc`
  ADD CONSTRAINT `lich_hoc_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lich_ranh`
--
ALTER TABLE `lich_ranh`
  ADD CONSTRAINT `lich_ranh_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `mau_tin_viec`
--
ALTER TABLE `mau_tin_viec`
  ADD CONSTRAINT `mau_tin_viec_ibfk_1` FOREIGN KEY (`nhom_viec_id`) REFERENCES `nhom_viec` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nhat_ky_admin`
--
ALTER TABLE `nhat_ky_admin`
  ADD CONSTRAINT `nhat_ky_admin_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `quan_tri_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `nhiem_vu`
--
ALTER TABLE `nhiem_vu`
  ADD CONSTRAINT `nhiem_vu_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `nhiem_vu_ibfk_2` FOREIGN KEY (`viec_lam_id`) REFERENCES `viec_lam` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `thong_bao`
--
ALTER TABLE `thong_bao`
  ADD CONSTRAINT `thong_bao_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `thong_bao_ntd`
--
ALTER TABLE `thong_bao_ntd`
  ADD CONSTRAINT `thong_bao_ntd_ibfk_1` FOREIGN KEY (`nha_tuyen_dung_id`) REFERENCES `nha_tuyen_dung` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tin_nhan`
--
ALTER TABLE `tin_nhan`
  ADD CONSTRAINT `tin_nhan_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tin_nhan_ibfk_2` FOREIGN KEY (`nha_tuyen_dung_id`) REFERENCES `nha_tuyen_dung` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ung_tuyen`
--
ALTER TABLE `ung_tuyen`
  ADD CONSTRAINT `ung_tuyen_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ung_tuyen_ibfk_2` FOREIGN KEY (`viec_lam_id`) REFERENCES `viec_lam` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `viec_lam`
--
ALTER TABLE `viec_lam`
  ADD CONSTRAINT `viec_lam_ibfk_1` FOREIGN KEY (`nha_tuyen_dung_id`) REFERENCES `nha_tuyen_dung` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vi_ntd`
--
ALTER TABLE `vi_ntd`
  ADD CONSTRAINT `vi_ntd_ibfk_1` FOREIGN KEY (`nha_tuyen_dung_id`) REFERENCES `nha_tuyen_dung` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vi_tien`
--
ALTER TABLE `vi_tien`
  ADD CONSTRAINT `vi_tien_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `yeu_cau_rut_tien`
--
ALTER TABLE `yeu_cau_rut_tien`
  ADD CONSTRAINT `yeu_cau_rut_tien_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `yeu_cau_xac_thuc`
--
ALTER TABLE `yeu_cau_xac_thuc`
  ADD CONSTRAINT `yeu_cau_xac_thuc_ibfk_1` FOREIGN KEY (`sinh_vien_id`) REFERENCES `sinh_vien` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `yeu_cau_xac_thuc_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `quan_tri_vien` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
