import type { Airport, LocalisedText } from './model';

const localised = (en: string, zh: string): LocalisedText => ({ en, zh });

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
