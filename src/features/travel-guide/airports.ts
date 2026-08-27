import type { Airport, LocalisedText, TravelLanguage } from './model';

const localised = (en: string, zh: string): LocalisedText => ({ en, zh });

/**
 * Country/region captions for the codes carried on the airports below.
 *
 * The three-letter code alone does not say where a place is, and the city name
 * often does not either — a transit warning that reads "TPE · 台北" is far less
 * useful than one that says which jurisdiction's rules apply.
 */
const COUNTRY_NAMES: Record<string, LocalisedText> = {
  AE: localised('United Arab Emirates', '阿联酋'),
  AU: localised('Australia', '澳大利亚'),
  BD: localised('Bangladesh', '孟加拉国'),
  CA: localised('Canada', '加拿大'),
  CN: localised('China', '中国'),
  DE: localised('Germany', '德国'),
  FI: localised('Finland', '芬兰'),
  FR: localised('France', '法国'),
  GB: localised('United Kingdom', '英国'),
  HK: localised('Hong Kong', '香港'),
  ID: localised('Indonesia', '印度尼西亚'),
  IN: localised('India', '印度'),
  JP: localised('Japan', '日本'),
  KH: localised('Cambodia', '柬埔寨'),
  KR: localised('South Korea', '韩国'),
  LK: localised('Sri Lanka', '斯里兰卡'),
  MN: localised('Mongolia', '蒙古'),
  MO: localised('Macau', '澳门'),
  MY: localised('Malaysia', '马来西亚'),
  NL: localised('Netherlands', '荷兰'),
  NP: localised('Nepal', '尼泊尔'),
  PH: localised('Philippines', '菲律宾'),
  PK: localised('Pakistan', '巴基斯坦'),
  QA: localised('Qatar', '卡塔尔'),
  SG: localised('Singapore', '新加坡'),
  TH: localised('Thailand', '泰国'),
  TR: localised('Türkiye', '土耳其'),
  TW: localised('Taiwan', '台湾'),
  US: localised('United States', '美国'),
  VN: localised('Vietnam', '越南'),
};

/** Empty for an unknown code, so callers can omit the caption rather than print a raw code. */
export function countryName(countryCode: string, language: TravelLanguage): string {
  const entry = COUNTRY_NAMES[countryCode.toUpperCase()];
  return entry ? entry[language] : '';
}

function airport(
  code: string,
  cityEn: string,
  cityZh: string,
  nameEn: string,
  nameZh: string,
  countryCode: string,
  latitude: number,
  longitude: number,
): Airport {
  return {
    code,
    city: localised(cityEn, cityZh),
    name: localised(nameEn, nameZh),
    countryCode,
    latitude,
    longitude,
  };
}

export const AIRPORTS: Record<string, Airport> = {
  PEK: airport('PEK', 'Beijing', '北京', 'Beijing Capital International Airport', '北京首都国际机场', 'CN', 40.0799, 116.6031),
  PKX: airport('PKX', 'Beijing', '北京', 'Beijing Daxing International Airport', '北京大兴国际机场', 'CN', 39.5098, 116.4105),
  PVG: airport('PVG', 'Shanghai', '上海', 'Shanghai Pudong International Airport', '上海浦东国际机场', 'CN', 31.1443, 121.8083),
  SHA: airport('SHA', 'Shanghai', '上海', 'Shanghai Hongqiao International Airport', '上海虹桥国际机场', 'CN', 31.1979, 121.3363),
  CAN: airport('CAN', 'Guangzhou', '广州', 'Guangzhou Baiyun International Airport', '广州白云国际机场', 'CN', 23.3924, 113.2988),
  SZX: airport('SZX', 'Shenzhen', '深圳', 'Shenzhen Bao’an International Airport', '深圳宝安国际机场', 'CN', 22.6393, 113.8107),
  CTU: airport('CTU', 'Chengdu', '成都', 'Chengdu Shuangliu International Airport', '成都双流国际机场', 'CN', 30.5785, 103.9471),
  TFU: airport('TFU', 'Chengdu', '成都', 'Chengdu Tianfu International Airport', '成都天府国际机场', 'CN', 30.319, 104.445),
  XMN: airport('XMN', 'Xiamen', '厦门', 'Xiamen Gaoqi International Airport', '厦门高崎国际机场', 'CN', 24.544, 118.1277),
  HGH: airport('HGH', 'Hangzhou', '杭州', 'Hangzhou Xiaoshan International Airport', '杭州萧山国际机场', 'CN', 30.2295, 120.4344),
  TAO: airport('TAO', 'Qingdao', '青岛', 'Qingdao Jiaodong International Airport', '青岛胶东国际机场', 'CN', 36.3619, 120.0882),
  HKG: airport('HKG', 'Hong Kong', '香港', 'Hong Kong International Airport', '香港国际机场', 'HK', 22.308, 113.9185),
  TPE: airport('TPE', 'Taipei', '台北', 'Taiwan Taoyuan International Airport', '台湾桃园国际机场', 'TW', 25.0797, 121.2342),
  TSA: airport('TSA', 'Taipei', '台北', 'Taipei Songshan Airport', '台北松山机场', 'TW', 25.0697, 121.5525),
  ICN: airport('ICN', 'Seoul', '首尔', 'Incheon International Airport', '仁川国际机场', 'KR', 37.4602, 126.4407),
  GMP: airport('GMP', 'Seoul', '首尔', 'Gimpo International Airport', '金浦国际机场', 'KR', 37.5583, 126.7906),
  PUS: airport('PUS', 'Busan', '釜山', 'Gimhae International Airport', '金海国际机场', 'KR', 35.1795, 128.9382),
  SIN: airport('SIN', 'Singapore', '新加坡', 'Singapore Changi Airport', '新加坡樟宜机场', 'SG', 1.3644, 103.9915),
  BKK: airport('BKK', 'Bangkok', '曼谷', 'Suvarnabhumi Airport', '素万那普机场', 'TH', 13.69, 100.7501),
  KUL: airport('KUL', 'Kuala Lumpur', '吉隆坡', 'Kuala Lumpur International Airport', '吉隆坡国际机场', 'MY', 2.7456, 101.7072),
  MNL: airport('MNL', 'Manila', '马尼拉', 'Ninoy Aquino International Airport', '尼诺伊·阿基诺国际机场', 'PH', 14.5086, 121.0198),
  HAN: airport('HAN', 'Hanoi', '河内', 'Noi Bai International Airport', '内排国际机场', 'VN', 21.2212, 105.8072),
  SGN: airport('SGN', 'Ho Chi Minh City', '胡志明市', 'Tan Son Nhat International Airport', '新山一国际机场', 'VN', 10.8188, 106.6519),
  DEL: airport('DEL', 'Delhi', '德里', 'Indira Gandhi International Airport', '英迪拉·甘地国际机场', 'IN', 28.5562, 77.1),
  BOM: airport('BOM', 'Mumbai', '孟买', 'Chhatrapati Shivaji Maharaj International Airport', '贾特拉帕蒂·希瓦吉国际机场', 'IN', 19.0896, 72.8656),
  CGK: airport('CGK', 'Jakarta', '雅加达', 'Soekarno–Hatta International Airport', '苏加诺-哈达国际机场', 'ID', -6.1256, 106.6559),
  LHR: airport('LHR', 'London', '伦敦', 'Heathrow Airport', '希思罗机场', 'GB', 51.47, -0.4543),
  CDG: airport('CDG', 'Paris', '巴黎', 'Charles de Gaulle Airport', '戴高乐机场', 'FR', 49.0097, 2.5479),
  FRA: airport('FRA', 'Frankfurt', '法兰克福', 'Frankfurt Airport', '法兰克福机场', 'DE', 50.0379, 8.5622),
  AMS: airport('AMS', 'Amsterdam', '阿姆斯特丹', 'Amsterdam Airport Schiphol', '阿姆斯特丹史基浦机场', 'NL', 52.3105, 4.7683),
  HEL: airport('HEL', 'Helsinki', '赫尔辛基', 'Helsinki Airport', '赫尔辛基机场', 'FI', 60.3172, 24.9633),
  IST: airport('IST', 'Istanbul', '伊斯坦布尔', 'Istanbul Airport', '伊斯坦布尔机场', 'TR', 41.2753, 28.7519),
  DOH: airport('DOH', 'Doha', '多哈', 'Hamad International Airport', '哈马德国际机场', 'QA', 25.2731, 51.6081),
  DXB: airport('DXB', 'Dubai', '迪拜', 'Dubai International Airport', '迪拜国际机场', 'AE', 25.2532, 55.3657),
  JFK: airport('JFK', 'New York', '纽约', 'John F. Kennedy International Airport', '约翰·肯尼迪国际机场', 'US', 40.6413, -73.7781),
  LAX: airport('LAX', 'Los Angeles', '洛杉矶', 'Los Angeles International Airport', '洛杉矶国际机场', 'US', 33.9416, -118.4085),
  SFO: airport('SFO', 'San Francisco', '旧金山', 'San Francisco International Airport', '旧金山国际机场', 'US', 37.6213, -122.379),
  SEA: airport('SEA', 'Seattle', '西雅图', 'Seattle–Tacoma International Airport', '西雅图-塔科马国际机场', 'US', 47.4502, -122.3088),
  YVR: airport('YVR', 'Vancouver', '温哥华', 'Vancouver International Airport', '温哥华国际机场', 'CA', 49.1967, -123.1815),
  SYD: airport('SYD', 'Sydney', '悉尼', 'Sydney Airport', '悉尼机场', 'AU', -33.9399, 151.1753),
  MEL: airport('MEL', 'Melbourne', '墨尔本', 'Melbourne Airport', '墨尔本机场', 'AU', -37.669, 144.841),
  HND: airport('HND', 'Tokyo', '东京', 'Haneda Airport', '羽田机场', 'JP', 35.5494, 139.7798),
  NRT: airport('NRT', 'Tokyo', '东京', 'Narita International Airport', '成田国际机场', 'JP', 35.772, 140.3929),
  KIX: airport('KIX', 'Osaka', '大阪', 'Kansai International Airport', '关西国际机场', 'JP', 34.4347, 135.244),
  ITM: airport('ITM', 'Osaka', '大阪', 'Osaka International Airport', '大阪国际机场', 'JP', 34.7855, 135.4382),
  NGO: airport('NGO', 'Nagoya', '名古屋', 'Chubu Centrair International Airport', '中部国际机场', 'JP', 34.8584, 136.8054),
  CTS: airport('CTS', 'Sapporo', '札幌', 'New Chitose Airport', '新千岁机场', 'JP', 42.7752, 141.6923),
  OKA: airport('OKA', 'Okinawa', '冲绳', 'Naha Airport', '那霸机场', 'JP', 26.1958, 127.6459),
  HIJ: airport('HIJ', 'Hiroshima', '广岛', 'Hiroshima Airport', '广岛机场', 'JP', 34.4361, 132.9194),
  FUK: airport('FUK', 'Fukuoka', '福冈', 'Fukuoka Airport', '福冈机场', 'JP', 33.5859, 130.4507),
  KKJ: airport('KKJ', 'Kitakyushu', '北九州', 'Kitakyushu Airport', '北九州机场', 'JP', 33.8459, 131.0347),

  // Codes outside this table still work — the search only checks the shape
  // /^[A-Z]{3}$/ and `resolveAirport` falls back to an approximate entry.
  // Listing them here is what puts them in the suggestion dropdown and gives
  // the route map real coordinates.
  CSX: airport('CSX', 'Changsha', '长沙', 'Changsha Huanghua International Airport', '长沙黄花国际机场', 'CN', 28.1892, 113.2196),
  WUH: airport('WUH', 'Wuhan', '武汉', 'Wuhan Tianhe International Airport', '武汉天河国际机场', 'CN', 30.7838, 114.2081),
  CKG: airport('CKG', 'Chongqing', '重庆', 'Chongqing Jiangbei International Airport', '重庆江北国际机场', 'CN', 29.7192, 106.6417),
  XIY: airport('XIY', 'Xi’an', '西安', 'Xi’an Xianyang International Airport', '西安咸阳国际机场', 'CN', 34.4471, 108.7516),
  KMG: airport('KMG', 'Kunming', '昆明', 'Kunming Changshui International Airport', '昆明长水国际机场', 'CN', 25.1019, 102.9292),
  KHN: airport('KHN', 'Nanchang', '南昌', 'Nanchang Changbei International Airport', '南昌昌北国际机场', 'CN', 28.865, 115.9),
  NKG: airport('NKG', 'Nanjing', '南京', 'Nanjing Lukou International Airport', '南京禄口国际机场', 'CN', 31.742, 118.8622),
  TSN: airport('TSN', 'Tianjin', '天津', 'Tianjin Binhai International Airport', '天津滨海国际机场', 'CN', 39.1244, 117.3462),
  SHE: airport('SHE', 'Shenyang', '沈阳', 'Shenyang Taoxian International Airport', '沈阳桃仙国际机场', 'CN', 41.6398, 123.4833),
  DLC: airport('DLC', 'Dalian', '大连', 'Dalian Zhoushuizi International Airport', '大连周水子国际机场', 'CN', 38.9657, 121.5386),
  HRB: airport('HRB', 'Harbin', '哈尔滨', 'Harbin Taiping International Airport', '哈尔滨太平国际机场', 'CN', 45.6234, 126.2503),
  CGO: airport('CGO', 'Zhengzhou', '郑州', 'Zhengzhou Xinzheng International Airport', '郑州新郑国际机场', 'CN', 34.5197, 113.8408),
  FOC: airport('FOC', 'Fuzhou', '福州', 'Fuzhou Changle International Airport', '福州长乐国际机场', 'CN', 25.9351, 119.6633),
  NNG: airport('NNG', 'Nanning', '南宁', 'Nanning Wuxu International Airport', '南宁吴圩国际机场', 'CN', 22.6083, 108.1722),
  KWE: airport('KWE', 'Guiyang', '贵阳', 'Guiyang Longdongbao International Airport', '贵阳龙洞堡国际机场', 'CN', 26.5385, 106.8007),
  URC: airport('URC', 'Ürümqi', '乌鲁木齐', 'Ürümqi Diwopu International Airport', '乌鲁木齐地窝堡国际机场', 'CN', 43.9071, 87.4742),
  TNA: airport('TNA', 'Jinan', '济南', 'Jinan Yaoqiang International Airport', '济南遥墙国际机场', 'CN', 36.8572, 117.216),
  HFE: airport('HFE', 'Hefei', '合肥', 'Hefei Xinqiao International Airport', '合肥新桥国际机场', 'CN', 31.78, 116.9767),
  NGB: airport('NGB', 'Ningbo', '宁波', 'Ningbo Lishe International Airport', '宁波栎社国际机场', 'CN', 29.8267, 121.4619),
  CGQ: airport('CGQ', 'Changchun', '长春', 'Changchun Longjia International Airport', '长春龙嘉国际机场', 'CN', 43.9962, 125.685),
  TYN: airport('TYN', 'Taiyuan', '太原', 'Taiyuan Wusu International Airport', '太原武宿国际机场', 'CN', 37.7469, 112.6284),
  SJW: airport('SJW', 'Shijiazhuang', '石家庄', 'Shijiazhuang Zhengding International Airport', '石家庄正定国际机场', 'CN', 38.2807, 114.6973),
  HAK: airport('HAK', 'Haikou', '海口', 'Haikou Meilan International Airport', '海口美兰国际机场', 'CN', 19.9349, 110.4589),
  SYX: airport('SYX', 'Sanya', '三亚', 'Sanya Phoenix International Airport', '三亚凤凰国际机场', 'CN', 18.3029, 109.4123),
  SWA: airport('SWA', 'Jieyang', '揭阳', 'Jieyang Chaoshan International Airport', '揭阳潮汕国际机场', 'CN', 23.5522, 116.5033),
  ZUH: airport('ZUH', 'Zhuhai', '珠海', 'Zhuhai Jinwan Airport', '珠海金湾机场', 'CN', 22.0064, 113.3762),
  HET: airport('HET', 'Hohhot', '呼和浩特', 'Hohhot Baita International Airport', '呼和浩特白塔国际机场', 'CN', 40.8514, 111.8244),
  LHW: airport('LHW', 'Lanzhou', '兰州', 'Lanzhou Zhongchuan International Airport', '兰州中川国际机场', 'CN', 36.5152, 103.6204),
  XNN: airport('XNN', 'Xining', '西宁', 'Xining Caojiabao International Airport', '西宁曹家堡国际机场', 'CN', 36.5275, 102.0429),
  INC: airport('INC', 'Yinchuan', '银川', 'Yinchuan Hedong International Airport', '银川河东国际机场', 'CN', 38.3219, 106.3931),
  WUX: airport('WUX', 'Wuxi', '无锡', 'Sunan Shuofang International Airport', '苏南硕放国际机场', 'CN', 31.4944, 120.4292),
  KHH: airport('KHH', 'Kaohsiung', '高雄', 'Kaohsiung International Airport', '高雄国际机场', 'TW', 22.5771, 120.35),
  SDJ: airport('SDJ', 'Sendai', '仙台', 'Sendai Airport', '仙台机场', 'JP', 38.1397, 140.917),
  KOJ: airport('KOJ', 'Kagoshima', '鹿儿岛', 'Kagoshima Airport', '鹿儿岛机场', 'JP', 31.8034, 130.7194),
  KMJ: airport('KMJ', 'Kumamoto', '熊本', 'Kumamoto Airport', '熊本机场', 'JP', 32.8373, 130.8551),
  NGS: airport('NGS', 'Nagasaki', '长崎', 'Nagasaki Airport', '长崎机场', 'JP', 32.9169, 129.9137),
  OKJ: airport('OKJ', 'Okayama', '冈山', 'Okayama Airport', '冈山机场', 'JP', 34.7569, 133.8553),
  TAK: airport('TAK', 'Takamatsu', '高松', 'Takamatsu Airport', '高松机场', 'JP', 34.2142, 134.0156),
  CJU: airport('CJU', 'Jeju', '济州', 'Jeju International Airport', '济州国际机场', 'KR', 33.5113, 126.493),
  MFM: airport('MFM', 'Macau', '澳门', 'Macau International Airport', '澳门国际机场', 'MO', 22.1496, 113.5915),
  ULN: airport('ULN', 'Ulaanbaatar', '乌兰巴托', 'Chinggis Khaan International Airport', '成吉思汗国际机场', 'MN', 47.6431, 106.82),
  KTM: airport('KTM', 'Kathmandu', '加德满都', 'Tribhuvan International Airport', '特里布万国际机场', 'NP', 27.6966, 85.3591),
  DAC: airport('DAC', 'Dhaka', '达卡', 'Hazrat Shahjalal International Airport', '沙阿贾拉勒国际机场', 'BD', 23.8433, 90.3978),
  CMB: airport('CMB', 'Colombo', '科伦坡', 'Bandaranaike International Airport', '班达拉奈克国际机场', 'LK', 7.1808, 79.8841),
  ISB: airport('ISB', 'Islamabad', '伊斯兰堡', 'Islamabad International Airport', '伊斯兰堡国际机场', 'PK', 33.5607, 72.8516),
  PNH: airport('PNH', 'Phnom Penh', '金边', 'Phnom Penh International Airport', '金边国际机场', 'KH', 11.5466, 104.8441),
  BLR: airport('BLR', 'Bengaluru', '班加罗尔', 'Kempegowda International Airport', '肯佩戈达国际机场', 'IN', 13.1986, 77.7066),
  MAA: airport('MAA', 'Chennai', '金奈', 'Chennai International Airport', '金奈国际机场', 'IN', 12.9941, 80.1709),
  HYD: airport('HYD', 'Hyderabad', '海得拉巴', 'Rajiv Gandhi International Airport', '拉吉夫·甘地国际机场', 'IN', 17.2403, 78.4294),
  DPS: airport('DPS', 'Denpasar', '登巴萨', 'Ngurah Rai International Airport', '伍拉·赖国际机场', 'ID', -8.7482, 115.1672),
  SUB: airport('SUB', 'Surabaya', '泗水', 'Juanda International Airport', '朱安达国际机场', 'ID', -7.3798, 112.7869),
  DAD: airport('DAD', 'Da Nang', '岘港', 'Da Nang International Airport', '岘港国际机场', 'VN', 16.0439, 108.1994),
};

export const AIRPORT_SUGGESTIONS = Object.values(AIRPORTS)
  .filter((item) => item.code !== 'FUK' && item.code !== 'KKJ')
  .sort((a, b) => a.code.localeCompare(b.code));

export function resolveAirport(code: string, providerName = ''): Airport {
  const normalisedCode = code.trim().toUpperCase();
  const known = AIRPORTS[normalisedCode];
  if (known) return known;

  return {
    code: normalisedCode,
    city: localised(normalisedCode, normalisedCode),
    name: localised(providerName || `${normalisedCode} Airport`, providerName || `${normalisedCode} 机场`),
    countryCode: 'XX',
    latitude: 0,
    longitude: 0,
    approximate: true,
  };
}

/**
 * Free-text airport lookup: a code, a city or an airport name, in either
 * language. Returns few enough rows to read at a glance, ordered so an exact
 * code match wins, then a city that starts with the query, then everything else
 * that merely contains it.
 */
export function searchAirports(query: string, limit = 8): Airport[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const scored: { airport: Airport; score: number }[] = [];
  for (const item of Object.values(AIRPORTS)) {
    const code = item.code.toLowerCase();
    const fields = [code, item.city.en.toLowerCase(), item.city.zh, item.name.en.toLowerCase(), item.name.zh];

    let score = -1;
    if (code === needle) score = 0;
    else if (code.startsWith(needle)) score = 1;
    else if (item.city.en.toLowerCase().startsWith(needle) || item.city.zh.startsWith(needle)) score = 2;
    else if (fields.some((field) => field.includes(needle))) score = 3;

    if (score >= 0) scored.push({ airport: item, score });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.airport.code.localeCompare(b.airport.code))
    .slice(0, limit)
    .map((entry) => entry.airport);
}
