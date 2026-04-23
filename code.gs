const SHEET_ID = '1Ao1iNbOOhVN8jlbLzpDLPTkHsP1UnVpI_Uov5xqIWAs'; // Spreadsheet ID
const SHEET_NAME = 'Master'; // Sheet Name
const FOLDER_ID = '1O159mC41Ap-4qkFOMxfef6QkRuLuKWEO'; // Folder ID for file uploads

function doGet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  // Ambil data untuk dropdowns
  const sumberValues = sheet.getRange('A2:A' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const durasiValues = sheet.getRange('B2:B' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const pendidikanValues = sheet.getRange('E2:E' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const kendaraanValues = sheet.getRange('F2:F' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const simValues = sheet.getRange('G2:G' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const industriValues = sheet.getRange('C2:C' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const posisiValues = sheet.getRange('D2:D' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const UnivValues = sheet.getRange('J2:J' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const jurusanValues = sheet.getRange('K2:K' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const provinsiValues = sheet.getRange('H2:H' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const kotaValues = sheet.getRange('I2:I' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const referensiValues = sheet.getRange('L2:L' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== '');
  const tempatInformasiValues = sheet.getRange('M2:M' + lastRow).getValues().flat()
    .filter(value => value && value.toString().trim() !== ''); // Ambil data tempat informasi

  // Mapping Minat Industri -> Minat Posisi
  const dataIndustriPosisi = {};
  const industriPosisiData = sheet.getRange('C2:D' + lastRow).getValues();
  industriPosisiData.forEach(row => {
    const industri = row[0];
    const posisi = row[1];
    if (industri && posisi) {
      if (!dataIndustriPosisi[industri]) {
        dataIndustriPosisi[industri] = [];
      }
      if (!dataIndustriPosisi[industri].includes(posisi)) {
        dataIndustriPosisi[industri].push(posisi);
      }
    }
  });

  // Mapping Provinsi -> Kota
  const dataProvinsiKota = {};
  const provinsiKotaData = sheet.getRange('H2:I' + lastRow).getValues();
  provinsiKotaData.forEach(row => {
    const provinsi = row[0];
    const kota = row[1];
    if (provinsi && kota) {
      if (!dataProvinsiKota[provinsi]) {
        dataProvinsiKota[provinsi] = [];
      }
      if (!dataProvinsiKota[provinsi].includes(kota)) {
        dataProvinsiKota[provinsi].push(kota);
      }
    }
  });

  // Payload data untuk dropdowns
  const payload = {
    sumberInformasi: [...new Set(sumberValues)],
    durasi: [...new Set(durasiValues)],
    pendidikan: [...new Set(pendidikanValues)],
    industri: [...new Set(industriValues)],
    industriPosisiMap: dataIndustriPosisi,
    minatPosisi: [...new Set(posisiValues)],
    provinsi: [...new Set(provinsiValues)],
    provinsiKotaMap: dataProvinsiKota,
    namaUniversitas: [...new Set(UnivValues)],
    kendaraan: [...new Set(kendaraanValues)],
    sim: [...new Set(simValues)],
    jurusan: [...new Set(jurusanValues)],
    referensi: [...new Set(referensiValues)],
    tempatInformasi: [...new Set(tempatInformasiValues)] // Tambahkan tempat informasi ke payload
  };

  return HtmlService.createHtmlOutputFromFile('index')
    .append(`<script>const dropdownData = ${JSON.stringify(payload)};</script>`);
}

function uploadCV(formData, base64File, fileName) {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);

    const contentType = 'application/pdf';
    const blob = Utilities.newBlob(Utilities.base64Decode(base64File), contentType, fileName);
    const file = folder.createFile(blob);
    const fileUrl = file.getUrl();

    // Pastikan Sheet 'Responses' ada, kalau belum buat otomatis
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName('Responses');
    if (!sheet) {
      sheet = ss.insertSheet('Responses');
      const headers = [
        'Timestamp', 'Email', 'Sumber Informasi', 'Nama Lengkap', 'Tanggal Lahir',
        'Nomor WA', 'Nomor HP', 'Jenis Kelamin', 'Pengalaman Posisi Kerja',
        'Durasi Pengalaman', 'Minat Posisi Pertama', 'Minat Posisi Kedua', 'Minat Posisi Ketiga','Pendidikan Terakhir',
        'Nama Sekolah', 'Jurusan', 'Kepemilikan Kendaraan', 'Kepemilikan SIM',
        'Alamat Domisili', 'Provinsi Penempatan', 'Kota Penempatan', 'Kec. Domisili', 'Kel. Domisili', 'URL CV', 'Nama Referensi', 'Tempat Informasi' // Tambahkan kolom Tempat Informasi
      ];
      sheet.appendRow(headers);
    }

const timestamp = new Date();
const finalData = [
  ...formData.slice(0, 20),      // Sampai Kota Penempatan
  formData[20],                  // Kec. Domisili
  formData[21],                  // Kel. Domisili
  fileUrl,                       // URL CV
  formData[22],                  // Nama Referensi
  formData[23]                   // Tempat Informasi
];



    sheet.appendRow([timestamp, ...finalData]); // Menyimpan data ke sheet Responses

    return 'success';
  } catch (e) {
    Logger.log('Error uploadCV: ' + e);
    throw new Error('Upload failed: ' + e);
  }
}



