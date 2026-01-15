/**
 * Countries Data Library
 * Complete list of countries with ISO codes and multilingual names
 * Supports: en, fr, sv, no, da, fi, ja, ko, zh-CN, zh-TW, ar
 * 
 * @module lib/data/countries
 */

import type { SupportedLocale } from '@/lib/i18n/types';

export interface CountryNames {
  en: string;
  fr: string;
  sv: string;
  no: string;
  da: string;
  fi: string;
  ja: string;
  ko: string;
  'zh-CN': string;
  'zh-TW': string;
  ar: string;
}

export interface Country {
  code: string;
  names: CountryNames;
}

// Country data with all supported languages
export const COUNTRIES: Record<string, Country> = {
  AF: { code: 'AF', names: { en: 'Afghanistan', fr: 'Afghanistan', sv: 'Afghanistan', no: 'Afghanistan', da: 'Afghanistan', fi: 'Afganistan', ja: 'アフガニスタン', ko: '아프가니스탄', 'zh-CN': '阿富汗', 'zh-TW': '阿富汗', ar: 'أفغانستان' } },
  AL: { code: 'AL', names: { en: 'Albania', fr: 'Albanie', sv: 'Albanien', no: 'Albania', da: 'Albanien', fi: 'Albania', ja: 'アルバニア', ko: '알바니아', 'zh-CN': '阿尔巴尼亚', 'zh-TW': '阿爾巴尼亞', ar: 'ألبانيا' } },
  DZ: { code: 'DZ', names: { en: 'Algeria', fr: 'Algérie', sv: 'Algeriet', no: 'Algerie', da: 'Algeriet', fi: 'Algeria', ja: 'アルジェリア', ko: '알제리', 'zh-CN': '阿尔及利亚', 'zh-TW': '阿爾及利亞', ar: 'الجزائر' } },
  AD: { code: 'AD', names: { en: 'Andorra', fr: 'Andorre', sv: 'Andorra', no: 'Andorra', da: 'Andorra', fi: 'Andorra', ja: 'アンドラ', ko: '안도라', 'zh-CN': '安道尔', 'zh-TW': '安道爾', ar: 'أندورا' } },
  AO: { code: 'AO', names: { en: 'Angola', fr: 'Angola', sv: 'Angola', no: 'Angola', da: 'Angola', fi: 'Angola', ja: 'アンゴラ', ko: '앙골라', 'zh-CN': '安哥拉', 'zh-TW': '安哥拉', ar: 'أنغولا' } },
  AR: { code: 'AR', names: { en: 'Argentina', fr: 'Argentine', sv: 'Argentina', no: 'Argentina', da: 'Argentina', fi: 'Argentiina', ja: 'アルゼンチン', ko: '아르헨티나', 'zh-CN': '阿根廷', 'zh-TW': '阿根廷', ar: 'الأرجنتين' } },
  AM: { code: 'AM', names: { en: 'Armenia', fr: 'Arménie', sv: 'Armenien', no: 'Armenia', da: 'Armenien', fi: 'Armenia', ja: 'アルメニア', ko: '아르메니아', 'zh-CN': '亚美尼亚', 'zh-TW': '亞美尼亞', ar: 'أرمينيا' } },
  AU: { code: 'AU', names: { en: 'Australia', fr: 'Australie', sv: 'Australien', no: 'Australia', da: 'Australien', fi: 'Australia', ja: 'オーストラリア', ko: '호주', 'zh-CN': '澳大利亚', 'zh-TW': '澳大利亞', ar: 'أستراليا' } },
  AT: { code: 'AT', names: { en: 'Austria', fr: 'Autriche', sv: 'Österrike', no: 'Østerrike', da: 'Østrig', fi: 'Itävalta', ja: 'オーストリア', ko: '오스트리아', 'zh-CN': '奥地利', 'zh-TW': '奧地利', ar: 'النمسا' } },
  AZ: { code: 'AZ', names: { en: 'Azerbaijan', fr: 'Azerbaïdjan', sv: 'Azerbajdzjan', no: 'Aserbajdsjan', da: 'Aserbajdsjan', fi: 'Azerbaidžan', ja: 'アゼルバイジャン', ko: '아제르바이잔', 'zh-CN': '阿塞拜疆', 'zh-TW': '亞塞拜然', ar: 'أذربيجان' } },
  BH: { code: 'BH', names: { en: 'Bahrain', fr: 'Bahreïn', sv: 'Bahrain', no: 'Bahrain', da: 'Bahrain', fi: 'Bahrain', ja: 'バーレーン', ko: '바레인', 'zh-CN': '巴林', 'zh-TW': '巴林', ar: 'البحرين' } },
  BD: { code: 'BD', names: { en: 'Bangladesh', fr: 'Bangladesh', sv: 'Bangladesh', no: 'Bangladesh', da: 'Bangladesh', fi: 'Bangladesh', ja: 'バングラデシュ', ko: '방글라데시', 'zh-CN': '孟加拉国', 'zh-TW': '孟加拉', ar: 'بنغلاديش' } },
  BY: { code: 'BY', names: { en: 'Belarus', fr: 'Biélorussie', sv: 'Vitryssland', no: 'Hviterussland', da: 'Hviderusland', fi: 'Valko-Venäjä', ja: 'ベラルーシ', ko: '벨라루스', 'zh-CN': '白俄罗斯', 'zh-TW': '白俄羅斯', ar: 'بيلاروسيا' } },
  BE: { code: 'BE', names: { en: 'Belgium', fr: 'Belgique', sv: 'Belgien', no: 'Belgia', da: 'Belgien', fi: 'Belgia', ja: 'ベルギー', ko: '벨기에', 'zh-CN': '比利时', 'zh-TW': '比利時', ar: 'بلجيكا' } },
  BJ: { code: 'BJ', names: { en: 'Benin', fr: 'Bénin', sv: 'Benin', no: 'Benin', da: 'Benin', fi: 'Benin', ja: 'ベナン', ko: '베냉', 'zh-CN': '贝宁', 'zh-TW': '貝南', ar: 'بنين' } },
  BO: { code: 'BO', names: { en: 'Bolivia', fr: 'Bolivie', sv: 'Bolivia', no: 'Bolivia', da: 'Bolivia', fi: 'Bolivia', ja: 'ボリビア', ko: '볼리비아', 'zh-CN': '玻利维亚', 'zh-TW': '玻利維亞', ar: 'بوليفيا' } },
  BA: { code: 'BA', names: { en: 'Bosnia and Herzegovina', fr: 'Bosnie-Herzégovine', sv: 'Bosnien och Hercegovina', no: 'Bosnia-Hercegovina', da: 'Bosnien-Hercegovina', fi: 'Bosnia ja Hertsegovina', ja: 'ボスニア・ヘルツェゴビナ', ko: '보스니아 헤르체고비나', 'zh-CN': '波斯尼亚和黑塞哥维那', 'zh-TW': '波士尼亞與赫塞哥維納', ar: 'البوسنة والهرسك' } },
  BW: { code: 'BW', names: { en: 'Botswana', fr: 'Botswana', sv: 'Botswana', no: 'Botswana', da: 'Botswana', fi: 'Botswana', ja: 'ボツワナ', ko: '보츠와나', 'zh-CN': '博茨瓦纳', 'zh-TW': '波札那', ar: 'بوتسوانا' } },
  BR: { code: 'BR', names: { en: 'Brazil', fr: 'Brésil', sv: 'Brasilien', no: 'Brasil', da: 'Brasilien', fi: 'Brasilia', ja: 'ブラジル', ko: '브라질', 'zh-CN': '巴西', 'zh-TW': '巴西', ar: 'البرازيل' } },
  BG: { code: 'BG', names: { en: 'Bulgaria', fr: 'Bulgarie', sv: 'Bulgarien', no: 'Bulgaria', da: 'Bulgarien', fi: 'Bulgaria', ja: 'ブルガリア', ko: '불가리아', 'zh-CN': '保加利亚', 'zh-TW': '保加利亞', ar: 'بلغاريا' } },
  BF: { code: 'BF', names: { en: 'Burkina Faso', fr: 'Burkina Faso', sv: 'Burkina Faso', no: 'Burkina Faso', da: 'Burkina Faso', fi: 'Burkina Faso', ja: 'ブルキナファソ', ko: '부르키나파소', 'zh-CN': '布基纳法索', 'zh-TW': '布吉納法索', ar: 'بوركينا فاسو' } },
  KH: { code: 'KH', names: { en: 'Cambodia', fr: 'Cambodge', sv: 'Kambodja', no: 'Kambodsja', da: 'Cambodja', fi: 'Kambodža', ja: 'カンボジア', ko: '캄보디아', 'zh-CN': '柬埔寨', 'zh-TW': '柬埔寨', ar: 'كمبوديا' } },
  CM: { code: 'CM', names: { en: 'Cameroon', fr: 'Cameroun', sv: 'Kamerun', no: 'Kamerun', da: 'Cameroun', fi: 'Kamerun', ja: 'カメルーン', ko: '카메룬', 'zh-CN': '喀麦隆', 'zh-TW': '喀麥隆', ar: 'الكاميرون' } },
  CA: { code: 'CA', names: { en: 'Canada', fr: 'Canada', sv: 'Kanada', no: 'Canada', da: 'Canada', fi: 'Kanada', ja: 'カナダ', ko: '캐나다', 'zh-CN': '加拿大', 'zh-TW': '加拿大', ar: 'كندا' } },
  CL: { code: 'CL', names: { en: 'Chile', fr: 'Chili', sv: 'Chile', no: 'Chile', da: 'Chile', fi: 'Chile', ja: 'チリ', ko: '칠레', 'zh-CN': '智利', 'zh-TW': '智利', ar: 'تشيلي' } },
  CN: { code: 'CN', names: { en: 'China', fr: 'Chine', sv: 'Kina', no: 'Kina', da: 'Kina', fi: 'Kiina', ja: '中国', ko: '중국', 'zh-CN': '中国', 'zh-TW': '中國', ar: 'الصين' } },
  CO: { code: 'CO', names: { en: 'Colombia', fr: 'Colombie', sv: 'Colombia', no: 'Colombia', da: 'Colombia', fi: 'Kolumbia', ja: 'コロンビア', ko: '콜롬비아', 'zh-CN': '哥伦比亚', 'zh-TW': '哥倫比亞', ar: 'كولومبيا' } },
  CG: { code: 'CG', names: { en: 'Congo', fr: 'Congo', sv: 'Kongo', no: 'Kongo', da: 'Congo', fi: 'Kongo', ja: 'コンゴ', ko: '콩고', 'zh-CN': '刚果', 'zh-TW': '剛果', ar: 'الكونغو' } },
  CD: { code: 'CD', names: { en: 'DR Congo', fr: 'RD Congo', sv: 'DR Kongo', no: 'DR Kongo', da: 'DR Congo', fi: 'Kongon demokraattinen tasavalta', ja: 'コンゴ民主共和国', ko: '콩고민주공화국', 'zh-CN': '刚果民主共和国', 'zh-TW': '剛果民主共和國', ar: 'جمهورية الكونغو الديمقراطية' } },
  CR: { code: 'CR', names: { en: 'Costa Rica', fr: 'Costa Rica', sv: 'Costa Rica', no: 'Costa Rica', da: 'Costa Rica', fi: 'Costa Rica', ja: 'コスタリカ', ko: '코스타리카', 'zh-CN': '哥斯达黎加', 'zh-TW': '哥斯大黎加', ar: 'كوستاريكا' } },
  CI: { code: 'CI', names: { en: "Côte d'Ivoire", fr: "Côte d'Ivoire", sv: 'Elfenbenskusten', no: 'Elfenbenskysten', da: 'Elfenbenskysten', fi: 'Norsunluurannikko', ja: 'コートジボワール', ko: '코트디부아르', 'zh-CN': '科特迪瓦', 'zh-TW': '象牙海岸', ar: 'ساحل العاج' } },
  HR: { code: 'HR', names: { en: 'Croatia', fr: 'Croatie', sv: 'Kroatien', no: 'Kroatia', da: 'Kroatien', fi: 'Kroatia', ja: 'クロアチア', ko: '크로아티아', 'zh-CN': '克罗地亚', 'zh-TW': '克羅埃西亞', ar: 'كرواتيا' } },
  CU: { code: 'CU', names: { en: 'Cuba', fr: 'Cuba', sv: 'Kuba', no: 'Cuba', da: 'Cuba', fi: 'Kuuba', ja: 'キューバ', ko: '쿠바', 'zh-CN': '古巴', 'zh-TW': '古巴', ar: 'كوبا' } },
  CY: { code: 'CY', names: { en: 'Cyprus', fr: 'Chypre', sv: 'Cypern', no: 'Kypros', da: 'Cypern', fi: 'Kypros', ja: 'キプロス', ko: '키프로스', 'zh-CN': '塞浦路斯', 'zh-TW': '賽普勒斯', ar: 'قبرص' } },
  CZ: { code: 'CZ', names: { en: 'Czechia', fr: 'Tchéquie', sv: 'Tjeckien', no: 'Tsjekkia', da: 'Tjekkiet', fi: 'Tšekki', ja: 'チェコ', ko: '체코', 'zh-CN': '捷克', 'zh-TW': '捷克', ar: 'التشيك' } },
  DK: { code: 'DK', names: { en: 'Denmark', fr: 'Danemark', sv: 'Danmark', no: 'Danmark', da: 'Danmark', fi: 'Tanska', ja: 'デンマーク', ko: '덴마크', 'zh-CN': '丹麦', 'zh-TW': '丹麥', ar: 'الدنمارك' } },
  DO: { code: 'DO', names: { en: 'Dominican Republic', fr: 'République dominicaine', sv: 'Dominikanska republiken', no: 'Den dominikanske republikk', da: 'Den Dominikanske Republik', fi: 'Dominikaaninen tasavalta', ja: 'ドミニカ共和国', ko: '도미니카 공화국', 'zh-CN': '多米尼加', 'zh-TW': '多明尼加', ar: 'جمهورية الدومينيكان' } },
  EC: { code: 'EC', names: { en: 'Ecuador', fr: 'Équateur', sv: 'Ecuador', no: 'Ecuador', da: 'Ecuador', fi: 'Ecuador', ja: 'エクアドル', ko: '에콰도르', 'zh-CN': '厄瓜多尔', 'zh-TW': '厄瓜多', ar: 'الإكوادور' } },
  EG: { code: 'EG', names: { en: 'Egypt', fr: 'Égypte', sv: 'Egypten', no: 'Egypt', da: 'Egypten', fi: 'Egypti', ja: 'エジプト', ko: '이집트', 'zh-CN': '埃及', 'zh-TW': '埃及', ar: 'مصر' } },
  SV: { code: 'SV', names: { en: 'El Salvador', fr: 'Salvador', sv: 'El Salvador', no: 'El Salvador', da: 'El Salvador', fi: 'El Salvador', ja: 'エルサルバドル', ko: '엘살바도르', 'zh-CN': '萨尔瓦多', 'zh-TW': '薩爾瓦多', ar: 'السلفادور' } },
  EE: { code: 'EE', names: { en: 'Estonia', fr: 'Estonie', sv: 'Estland', no: 'Estland', da: 'Estland', fi: 'Viro', ja: 'エストニア', ko: '에스토니아', 'zh-CN': '爱沙尼亚', 'zh-TW': '愛沙尼亞', ar: 'إستونيا' } },
  ET: { code: 'ET', names: { en: 'Ethiopia', fr: 'Éthiopie', sv: 'Etiopien', no: 'Etiopia', da: 'Etiopien', fi: 'Etiopia', ja: 'エチオピア', ko: '에티오피아', 'zh-CN': '埃塞俄比亚', 'zh-TW': '衣索比亞', ar: 'إثيوبيا' } },
  FI: { code: 'FI', names: { en: 'Finland', fr: 'Finlande', sv: 'Finland', no: 'Finland', da: 'Finland', fi: 'Suomi', ja: 'フィンランド', ko: '핀란드', 'zh-CN': '芬兰', 'zh-TW': '芬蘭', ar: 'فنلندا' } },
  FR: { code: 'FR', names: { en: 'France', fr: 'France', sv: 'Frankrike', no: 'Frankrike', da: 'Frankrig', fi: 'Ranska', ja: 'フランス', ko: '프랑스', 'zh-CN': '法国', 'zh-TW': '法國', ar: 'فرنسا' } },
  GA: { code: 'GA', names: { en: 'Gabon', fr: 'Gabon', sv: 'Gabon', no: 'Gabon', da: 'Gabon', fi: 'Gabon', ja: 'ガボン', ko: '가봉', 'zh-CN': '加蓬', 'zh-TW': '加彭', ar: 'الغابون' } },
  GE: { code: 'GE', names: { en: 'Georgia', fr: 'Géorgie', sv: 'Georgien', no: 'Georgia', da: 'Georgien', fi: 'Georgia', ja: 'ジョージア', ko: '조지아', 'zh-CN': '格鲁吉亚', 'zh-TW': '喬治亞', ar: 'جورجيا' } },
  DE: { code: 'DE', names: { en: 'Germany', fr: 'Allemagne', sv: 'Tyskland', no: 'Tyskland', da: 'Tyskland', fi: 'Saksa', ja: 'ドイツ', ko: '독일', 'zh-CN': '德国', 'zh-TW': '德國', ar: 'ألمانيا' } },
  GH: { code: 'GH', names: { en: 'Ghana', fr: 'Ghana', sv: 'Ghana', no: 'Ghana', da: 'Ghana', fi: 'Ghana', ja: 'ガーナ', ko: '가나', 'zh-CN': '加纳', 'zh-TW': '迦納', ar: 'غانا' } },
  GR: { code: 'GR', names: { en: 'Greece', fr: 'Grèce', sv: 'Grekland', no: 'Hellas', da: 'Grækenland', fi: 'Kreikka', ja: 'ギリシャ', ko: '그리스', 'zh-CN': '希腊', 'zh-TW': '希臘', ar: 'اليونان' } },
  GT: { code: 'GT', names: { en: 'Guatemala', fr: 'Guatemala', sv: 'Guatemala', no: 'Guatemala', da: 'Guatemala', fi: 'Guatemala', ja: 'グアテマラ', ko: '과테말라', 'zh-CN': '危地马拉', 'zh-TW': '瓜地馬拉', ar: 'غواتيمالا' } },
  GN: { code: 'GN', names: { en: 'Guinea', fr: 'Guinée', sv: 'Guinea', no: 'Guinea', da: 'Guinea', fi: 'Guinea', ja: 'ギニア', ko: '기니', 'zh-CN': '几内亚', 'zh-TW': '幾內亞', ar: 'غينيا' } },
  HT: { code: 'HT', names: { en: 'Haiti', fr: 'Haïti', sv: 'Haiti', no: 'Haiti', da: 'Haiti', fi: 'Haiti', ja: 'ハイチ', ko: '아이티', 'zh-CN': '海地', 'zh-TW': '海地', ar: 'هايتي' } },
  HN: { code: 'HN', names: { en: 'Honduras', fr: 'Honduras', sv: 'Honduras', no: 'Honduras', da: 'Honduras', fi: 'Honduras', ja: 'ホンジュラス', ko: '온두라스', 'zh-CN': '洪都拉斯', 'zh-TW': '宏都拉斯', ar: 'هندوراس' } },
  HK: { code: 'HK', names: { en: 'Hong Kong', fr: 'Hong Kong', sv: 'Hongkong', no: 'Hongkong', da: 'Hongkong', fi: 'Hongkong', ja: '香港', ko: '홍콩', 'zh-CN': '香港', 'zh-TW': '香港', ar: 'هونغ كونغ' } },
  HU: { code: 'HU', names: { en: 'Hungary', fr: 'Hongrie', sv: 'Ungern', no: 'Ungarn', da: 'Ungarn', fi: 'Unkari', ja: 'ハンガリー', ko: '헝가리', 'zh-CN': '匈牙利', 'zh-TW': '匈牙利', ar: 'المجر' } },
  IS: { code: 'IS', names: { en: 'Iceland', fr: 'Islande', sv: 'Island', no: 'Island', da: 'Island', fi: 'Islanti', ja: 'アイスランド', ko: '아이슬란드', 'zh-CN': '冰岛', 'zh-TW': '冰島', ar: 'آيسلندا' } },
  IN: { code: 'IN', names: { en: 'India', fr: 'Inde', sv: 'Indien', no: 'India', da: 'Indien', fi: 'Intia', ja: 'インド', ko: '인도', 'zh-CN': '印度', 'zh-TW': '印度', ar: 'الهند' } },
  ID: { code: 'ID', names: { en: 'Indonesia', fr: 'Indonésie', sv: 'Indonesien', no: 'Indonesia', da: 'Indonesien', fi: 'Indonesia', ja: 'インドネシア', ko: '인도네시아', 'zh-CN': '印度尼西亚', 'zh-TW': '印尼', ar: 'إندونيسيا' } },
  IR: { code: 'IR', names: { en: 'Iran', fr: 'Iran', sv: 'Iran', no: 'Iran', da: 'Iran', fi: 'Iran', ja: 'イラン', ko: '이란', 'zh-CN': '伊朗', 'zh-TW': '伊朗', ar: 'إيران' } },
  IQ: { code: 'IQ', names: { en: 'Iraq', fr: 'Irak', sv: 'Irak', no: 'Irak', da: 'Irak', fi: 'Irak', ja: 'イラク', ko: '이라크', 'zh-CN': '伊拉克', 'zh-TW': '伊拉克', ar: 'العراق' } },
  IE: { code: 'IE', names: { en: 'Ireland', fr: 'Irlande', sv: 'Irland', no: 'Irland', da: 'Irland', fi: 'Irlanti', ja: 'アイルランド', ko: '아일랜드', 'zh-CN': '爱尔兰', 'zh-TW': '愛爾蘭', ar: 'أيرلندا' } },
  IL: { code: 'IL', names: { en: 'Israel', fr: 'Israël', sv: 'Israel', no: 'Israel', da: 'Israel', fi: 'Israel', ja: 'イスラエル', ko: '이스라엘', 'zh-CN': '以色列', 'zh-TW': '以色列', ar: 'إسرائيل' } },
  IT: { code: 'IT', names: { en: 'Italy', fr: 'Italie', sv: 'Italien', no: 'Italia', da: 'Italien', fi: 'Italia', ja: 'イタリア', ko: '이탈리아', 'zh-CN': '意大利', 'zh-TW': '義大利', ar: 'إيطاليا' } },
  JM: { code: 'JM', names: { en: 'Jamaica', fr: 'Jamaïque', sv: 'Jamaica', no: 'Jamaica', da: 'Jamaica', fi: 'Jamaika', ja: 'ジャマイカ', ko: '자메이카', 'zh-CN': '牙买加', 'zh-TW': '牙買加', ar: 'جامايكا' } },
  JP: { code: 'JP', names: { en: 'Japan', fr: 'Japon', sv: 'Japan', no: 'Japan', da: 'Japan', fi: 'Japani', ja: '日本', ko: '일본', 'zh-CN': '日本', 'zh-TW': '日本', ar: 'اليابان' } },
  JO: { code: 'JO', names: { en: 'Jordan', fr: 'Jordanie', sv: 'Jordanien', no: 'Jordan', da: 'Jordan', fi: 'Jordania', ja: 'ヨルダン', ko: '요르단', 'zh-CN': '约旦', 'zh-TW': '約旦', ar: 'الأردن' } },
  KZ: { code: 'KZ', names: { en: 'Kazakhstan', fr: 'Kazakhstan', sv: 'Kazakstan', no: 'Kasakhstan', da: 'Kasakhstan', fi: 'Kazakstan', ja: 'カザフスタン', ko: '카자흐스탄', 'zh-CN': '哈萨克斯坦', 'zh-TW': '哈薩克', ar: 'كازاخستان' } },
  KE: { code: 'KE', names: { en: 'Kenya', fr: 'Kenya', sv: 'Kenya', no: 'Kenya', da: 'Kenya', fi: 'Kenia', ja: 'ケニア', ko: '케냐', 'zh-CN': '肯尼亚', 'zh-TW': '肯亞', ar: 'كينيا' } },
  KP: { code: 'KP', names: { en: 'North Korea', fr: 'Corée du Nord', sv: 'Nordkorea', no: 'Nord-Korea', da: 'Nordkorea', fi: 'Pohjois-Korea', ja: '北朝鮮', ko: '북한', 'zh-CN': '朝鲜', 'zh-TW': '北韓', ar: 'كوريا الشمالية' } },
  KR: { code: 'KR', names: { en: 'South Korea', fr: 'Corée du Sud', sv: 'Sydkorea', no: 'Sør-Korea', da: 'Sydkorea', fi: 'Etelä-Korea', ja: '韓国', ko: '대한민국', 'zh-CN': '韩国', 'zh-TW': '南韓', ar: 'كوريا الجنوبية' } },
  KW: { code: 'KW', names: { en: 'Kuwait', fr: 'Koweït', sv: 'Kuwait', no: 'Kuwait', da: 'Kuwait', fi: 'Kuwait', ja: 'クウェート', ko: '쿠웨이트', 'zh-CN': '科威特', 'zh-TW': '科威特', ar: 'الكويت' } },
  LV: { code: 'LV', names: { en: 'Latvia', fr: 'Lettonie', sv: 'Lettland', no: 'Latvia', da: 'Letland', fi: 'Latvia', ja: 'ラトビア', ko: '라트비아', 'zh-CN': '拉脱维亚', 'zh-TW': '拉脫維亞', ar: 'لاتفيا' } },
  LB: { code: 'LB', names: { en: 'Lebanon', fr: 'Liban', sv: 'Libanon', no: 'Libanon', da: 'Libanon', fi: 'Libanon', ja: 'レバノン', ko: '레바논', 'zh-CN': '黎巴嫩', 'zh-TW': '黎巴嫩', ar: 'لبنان' } },
  LY: { code: 'LY', names: { en: 'Libya', fr: 'Libye', sv: 'Libyen', no: 'Libya', da: 'Libyen', fi: 'Libya', ja: 'リビア', ko: '리비아', 'zh-CN': '利比亚', 'zh-TW': '利比亞', ar: 'ليبيا' } },
  LT: { code: 'LT', names: { en: 'Lithuania', fr: 'Lituanie', sv: 'Litauen', no: 'Litauen', da: 'Litauen', fi: 'Liettua', ja: 'リトアニア', ko: '리투아니아', 'zh-CN': '立陶宛', 'zh-TW': '立陶宛', ar: 'ليتوانيا' } },
  LU: { code: 'LU', names: { en: 'Luxembourg', fr: 'Luxembourg', sv: 'Luxemburg', no: 'Luxembourg', da: 'Luxembourg', fi: 'Luxemburg', ja: 'ルクセンブルク', ko: '룩셈부르크', 'zh-CN': '卢森堡', 'zh-TW': '盧森堡', ar: 'لوكسمبورغ' } },
  MO: { code: 'MO', names: { en: 'Macao', fr: 'Macao', sv: 'Macao', no: 'Macao', da: 'Macao', fi: 'Macao', ja: 'マカオ', ko: '마카오', 'zh-CN': '澳门', 'zh-TW': '澳門', ar: 'ماكاو' } },
  MG: { code: 'MG', names: { en: 'Madagascar', fr: 'Madagascar', sv: 'Madagaskar', no: 'Madagaskar', da: 'Madagaskar', fi: 'Madagaskar', ja: 'マダガスカル', ko: '마다가스카르', 'zh-CN': '马达加斯加', 'zh-TW': '馬達加斯加', ar: 'مدغشقر' } },
  MY: { code: 'MY', names: { en: 'Malaysia', fr: 'Malaisie', sv: 'Malaysia', no: 'Malaysia', da: 'Malaysia', fi: 'Malesia', ja: 'マレーシア', ko: '말레이시아', 'zh-CN': '马来西亚', 'zh-TW': '馬來西亞', ar: 'ماليزيا' } },
  ML: { code: 'ML', names: { en: 'Mali', fr: 'Mali', sv: 'Mali', no: 'Mali', da: 'Mali', fi: 'Mali', ja: 'マリ', ko: '말리', 'zh-CN': '马里', 'zh-TW': '馬利', ar: 'مالي' } },
  MT: { code: 'MT', names: { en: 'Malta', fr: 'Malte', sv: 'Malta', no: 'Malta', da: 'Malta', fi: 'Malta', ja: 'マルタ', ko: '몰타', 'zh-CN': '马耳他', 'zh-TW': '馬爾他', ar: 'مالطا' } },
  MR: { code: 'MR', names: { en: 'Mauritania', fr: 'Mauritanie', sv: 'Mauretanien', no: 'Mauritania', da: 'Mauretanien', fi: 'Mauritania', ja: 'モーリタニア', ko: '모리타니', 'zh-CN': '毛里塔尼亚', 'zh-TW': '茅利塔尼亞', ar: 'موريتانيا' } },
  MU: { code: 'MU', names: { en: 'Mauritius', fr: 'Maurice', sv: 'Mauritius', no: 'Mauritius', da: 'Mauritius', fi: 'Mauritius', ja: 'モーリシャス', ko: '모리셔스', 'zh-CN': '毛里求斯', 'zh-TW': '模里西斯', ar: 'موريشيوس' } },
  MX: { code: 'MX', names: { en: 'Mexico', fr: 'Mexique', sv: 'Mexiko', no: 'Mexico', da: 'Mexico', fi: 'Meksiko', ja: 'メキシコ', ko: '멕시코', 'zh-CN': '墨西哥', 'zh-TW': '墨西哥', ar: 'المكسيك' } },
  MD: { code: 'MD', names: { en: 'Moldova', fr: 'Moldavie', sv: 'Moldavien', no: 'Moldova', da: 'Moldova', fi: 'Moldova', ja: 'モルドバ', ko: '몰도바', 'zh-CN': '摩尔多瓦', 'zh-TW': '摩爾多瓦', ar: 'مولدوفا' } },
  MC: { code: 'MC', names: { en: 'Monaco', fr: 'Monaco', sv: 'Monaco', no: 'Monaco', da: 'Monaco', fi: 'Monaco', ja: 'モナコ', ko: '모나코', 'zh-CN': '摩纳哥', 'zh-TW': '摩納哥', ar: 'موناكو' } },
  MN: { code: 'MN', names: { en: 'Mongolia', fr: 'Mongolie', sv: 'Mongoliet', no: 'Mongolia', da: 'Mongoliet', fi: 'Mongolia', ja: 'モンゴル', ko: '몽골', 'zh-CN': '蒙古', 'zh-TW': '蒙古', ar: 'منغوليا' } },
  ME: { code: 'ME', names: { en: 'Montenegro', fr: 'Monténégro', sv: 'Montenegro', no: 'Montenegro', da: 'Montenegro', fi: 'Montenegro', ja: 'モンテネグロ', ko: '몬테네그로', 'zh-CN': '黑山', 'zh-TW': '蒙特內哥羅', ar: 'الجبل الأسود' } },
  MA: { code: 'MA', names: { en: 'Morocco', fr: 'Maroc', sv: 'Marocko', no: 'Marokko', da: 'Marokko', fi: 'Marokko', ja: 'モロッコ', ko: '모로코', 'zh-CN': '摩洛哥', 'zh-TW': '摩洛哥', ar: 'المغرب' } },
  MZ: { code: 'MZ', names: { en: 'Mozambique', fr: 'Mozambique', sv: 'Moçambique', no: 'Mosambik', da: 'Mozambique', fi: 'Mosambik', ja: 'モザンビーク', ko: '모잠비크', 'zh-CN': '莫桑比克', 'zh-TW': '莫三比克', ar: 'موزمبيق' } },
  MM: { code: 'MM', names: { en: 'Myanmar', fr: 'Myanmar', sv: 'Myanmar', no: 'Myanmar', da: 'Myanmar', fi: 'Myanmar', ja: 'ミャンマー', ko: '미얀마', 'zh-CN': '缅甸', 'zh-TW': '緬甸', ar: 'ميانمار' } },
  NA: { code: 'NA', names: { en: 'Namibia', fr: 'Namibie', sv: 'Namibia', no: 'Namibia', da: 'Namibia', fi: 'Namibia', ja: 'ナミビア', ko: '나미비아', 'zh-CN': '纳米比亚', 'zh-TW': '納米比亞', ar: 'ناميبيا' } },
  NP: { code: 'NP', names: { en: 'Nepal', fr: 'Népal', sv: 'Nepal', no: 'Nepal', da: 'Nepal', fi: 'Nepal', ja: 'ネパール', ko: '네팔', 'zh-CN': '尼泊尔', 'zh-TW': '尼泊爾', ar: 'نيبال' } },
  NL: { code: 'NL', names: { en: 'Netherlands', fr: 'Pays-Bas', sv: 'Nederländerna', no: 'Nederland', da: 'Holland', fi: 'Alankomaat', ja: 'オランダ', ko: '네덜란드', 'zh-CN': '荷兰', 'zh-TW': '荷蘭', ar: 'هولندا' } },
  NZ: { code: 'NZ', names: { en: 'New Zealand', fr: 'Nouvelle-Zélande', sv: 'Nya Zeeland', no: 'New Zealand', da: 'New Zealand', fi: 'Uusi-Seelanti', ja: 'ニュージーランド', ko: '뉴질랜드', 'zh-CN': '新西兰', 'zh-TW': '紐西蘭', ar: 'نيوزيلندا' } },
  NI: { code: 'NI', names: { en: 'Nicaragua', fr: 'Nicaragua', sv: 'Nicaragua', no: 'Nicaragua', da: 'Nicaragua', fi: 'Nicaragua', ja: 'ニカラグア', ko: '니카라과', 'zh-CN': '尼加拉瓜', 'zh-TW': '尼加拉瓜', ar: 'نيكاراغوا' } },
  NE: { code: 'NE', names: { en: 'Niger', fr: 'Niger', sv: 'Niger', no: 'Niger', da: 'Niger', fi: 'Niger', ja: 'ニジェール', ko: '니제르', 'zh-CN': '尼日尔', 'zh-TW': '尼日', ar: 'النيجر' } },
  NG: { code: 'NG', names: { en: 'Nigeria', fr: 'Nigeria', sv: 'Nigeria', no: 'Nigeria', da: 'Nigeria', fi: 'Nigeria', ja: 'ナイジェリア', ko: '나이지리아', 'zh-CN': '尼日利亚', 'zh-TW': '奈及利亞', ar: 'نيجيريا' } },
  MK: { code: 'MK', names: { en: 'North Macedonia', fr: 'Macédoine du Nord', sv: 'Nordmakedonien', no: 'Nord-Makedonia', da: 'Nordmakedonien', fi: 'Pohjois-Makedonia', ja: '北マケドニア', ko: '북마케도니아', 'zh-CN': '北马其顿', 'zh-TW': '北馬其頓', ar: 'مقدونيا الشمالية' } },
  NO: { code: 'NO', names: { en: 'Norway', fr: 'Norvège', sv: 'Norge', no: 'Norge', da: 'Norge', fi: 'Norja', ja: 'ノルウェー', ko: '노르웨이', 'zh-CN': '挪威', 'zh-TW': '挪威', ar: 'النرويج' } },
  OM: { code: 'OM', names: { en: 'Oman', fr: 'Oman', sv: 'Oman', no: 'Oman', da: 'Oman', fi: 'Oman', ja: 'オマーン', ko: '오만', 'zh-CN': '阿曼', 'zh-TW': '阿曼', ar: 'عُمان' } },
  PK: { code: 'PK', names: { en: 'Pakistan', fr: 'Pakistan', sv: 'Pakistan', no: 'Pakistan', da: 'Pakistan', fi: 'Pakistan', ja: 'パキスタン', ko: '파키스탄', 'zh-CN': '巴基斯坦', 'zh-TW': '巴基斯坦', ar: 'باكستان' } },
  PS: { code: 'PS', names: { en: 'Palestine', fr: 'Palestine', sv: 'Palestina', no: 'Palestina', da: 'Palæstina', fi: 'Palestiina', ja: 'パレスチナ', ko: '팔레스타인', 'zh-CN': '巴勒斯坦', 'zh-TW': '巴勒斯坦', ar: 'فلسطين' } },
  PA: { code: 'PA', names: { en: 'Panama', fr: 'Panama', sv: 'Panama', no: 'Panama', da: 'Panama', fi: 'Panama', ja: 'パナマ', ko: '파나마', 'zh-CN': '巴拿马', 'zh-TW': '巴拿馬', ar: 'بنما' } },
  PY: { code: 'PY', names: { en: 'Paraguay', fr: 'Paraguay', sv: 'Paraguay', no: 'Paraguay', da: 'Paraguay', fi: 'Paraguay', ja: 'パラグアイ', ko: '파라과이', 'zh-CN': '巴拉圭', 'zh-TW': '巴拉圭', ar: 'باراغواي' } },
  PE: { code: 'PE', names: { en: 'Peru', fr: 'Pérou', sv: 'Peru', no: 'Peru', da: 'Peru', fi: 'Peru', ja: 'ペルー', ko: '페루', 'zh-CN': '秘鲁', 'zh-TW': '秘魯', ar: 'بيرو' } },
  PH: { code: 'PH', names: { en: 'Philippines', fr: 'Philippines', sv: 'Filippinerna', no: 'Filippinene', da: 'Filippinerne', fi: 'Filippiinit', ja: 'フィリピン', ko: '필리핀', 'zh-CN': '菲律宾', 'zh-TW': '菲律賓', ar: 'الفلبين' } },
  PL: { code: 'PL', names: { en: 'Poland', fr: 'Pologne', sv: 'Polen', no: 'Polen', da: 'Polen', fi: 'Puola', ja: 'ポーランド', ko: '폴란드', 'zh-CN': '波兰', 'zh-TW': '波蘭', ar: 'بولندا' } },
  PT: { code: 'PT', names: { en: 'Portugal', fr: 'Portugal', sv: 'Portugal', no: 'Portugal', da: 'Portugal', fi: 'Portugali', ja: 'ポルトガル', ko: '포르투갈', 'zh-CN': '葡萄牙', 'zh-TW': '葡萄牙', ar: 'البرتغال' } },
  QA: { code: 'QA', names: { en: 'Qatar', fr: 'Qatar', sv: 'Qatar', no: 'Qatar', da: 'Qatar', fi: 'Qatar', ja: 'カタール', ko: '카타르', 'zh-CN': '卡塔尔', 'zh-TW': '卡達', ar: 'قطر' } },
  RO: { code: 'RO', names: { en: 'Romania', fr: 'Roumanie', sv: 'Rumänien', no: 'Romania', da: 'Rumænien', fi: 'Romania', ja: 'ルーマニア', ko: '루마니아', 'zh-CN': '罗马尼亚', 'zh-TW': '羅馬尼亞', ar: 'رومانيا' } },
  RU: { code: 'RU', names: { en: 'Russia', fr: 'Russie', sv: 'Ryssland', no: 'Russland', da: 'Rusland', fi: 'Venäjä', ja: 'ロシア', ko: '러시아', 'zh-CN': '俄罗斯', 'zh-TW': '俄羅斯', ar: 'روسيا' } },
  RW: { code: 'RW', names: { en: 'Rwanda', fr: 'Rwanda', sv: 'Rwanda', no: 'Rwanda', da: 'Rwanda', fi: 'Ruanda', ja: 'ルワンダ', ko: '르완다', 'zh-CN': '卢旺达', 'zh-TW': '盧安達', ar: 'رواندا' } },
  SA: { code: 'SA', names: { en: 'Saudi Arabia', fr: 'Arabie saoudite', sv: 'Saudiarabien', no: 'Saudi-Arabia', da: 'Saudi-Arabien', fi: 'Saudi-Arabia', ja: 'サウジアラビア', ko: '사우디아라비아', 'zh-CN': '沙特阿拉伯', 'zh-TW': '沙烏地阿拉伯', ar: 'المملكة العربية السعودية' } },
  SN: { code: 'SN', names: { en: 'Senegal', fr: 'Sénégal', sv: 'Senegal', no: 'Senegal', da: 'Senegal', fi: 'Senegal', ja: 'セネガル', ko: '세네갈', 'zh-CN': '塞内加尔', 'zh-TW': '塞內加爾', ar: 'السنغال' } },
  RS: { code: 'RS', names: { en: 'Serbia', fr: 'Serbie', sv: 'Serbien', no: 'Serbia', da: 'Serbien', fi: 'Serbia', ja: 'セルビア', ko: '세르비아', 'zh-CN': '塞尔维亚', 'zh-TW': '塞爾維亞', ar: 'صربيا' } },
  SG: { code: 'SG', names: { en: 'Singapore', fr: 'Singapour', sv: 'Singapore', no: 'Singapore', da: 'Singapore', fi: 'Singapore', ja: 'シンガポール', ko: '싱가포르', 'zh-CN': '新加坡', 'zh-TW': '新加坡', ar: 'سنغافورة' } },
  SK: { code: 'SK', names: { en: 'Slovakia', fr: 'Slovaquie', sv: 'Slovakien', no: 'Slovakia', da: 'Slovakiet', fi: 'Slovakia', ja: 'スロバキア', ko: '슬로바키아', 'zh-CN': '斯洛伐克', 'zh-TW': '斯洛伐克', ar: 'سلوفاكيا' } },
  SI: { code: 'SI', names: { en: 'Slovenia', fr: 'Slovénie', sv: 'Slovenien', no: 'Slovenia', da: 'Slovenien', fi: 'Slovenia', ja: 'スロベニア', ko: '슬로베니아', 'zh-CN': '斯洛文尼亚', 'zh-TW': '斯洛維尼亞', ar: 'سلوفينيا' } },
  SO: { code: 'SO', names: { en: 'Somalia', fr: 'Somalie', sv: 'Somalia', no: 'Somalia', da: 'Somalia', fi: 'Somalia', ja: 'ソマリア', ko: '소말리아', 'zh-CN': '索马里', 'zh-TW': '索馬利亞', ar: 'الصومال' } },
  ZA: { code: 'ZA', names: { en: 'South Africa', fr: 'Afrique du Sud', sv: 'Sydafrika', no: 'Sør-Afrika', da: 'Sydafrika', fi: 'Etelä-Afrikka', ja: '南アフリカ', ko: '남아프리카공화국', 'zh-CN': '南非', 'zh-TW': '南非', ar: 'جنوب أفريقيا' } },
  ES: { code: 'ES', names: { en: 'Spain', fr: 'Espagne', sv: 'Spanien', no: 'Spania', da: 'Spanien', fi: 'Espanja', ja: 'スペイン', ko: '스페인', 'zh-CN': '西班牙', 'zh-TW': '西班牙', ar: 'إسبانيا' } },
  LK: { code: 'LK', names: { en: 'Sri Lanka', fr: 'Sri Lanka', sv: 'Sri Lanka', no: 'Sri Lanka', da: 'Sri Lanka', fi: 'Sri Lanka', ja: 'スリランカ', ko: '스리랑카', 'zh-CN': '斯里兰卡', 'zh-TW': '斯里蘭卡', ar: 'سريلانكا' } },
  SD: { code: 'SD', names: { en: 'Sudan', fr: 'Soudan', sv: 'Sudan', no: 'Sudan', da: 'Sudan', fi: 'Sudan', ja: 'スーダン', ko: '수단', 'zh-CN': '苏丹', 'zh-TW': '蘇丹', ar: 'السودان' } },
  SE: { code: 'SE', names: { en: 'Sweden', fr: 'Suède', sv: 'Sverige', no: 'Sverige', da: 'Sverige', fi: 'Ruotsi', ja: 'スウェーデン', ko: '스웨덴', 'zh-CN': '瑞典', 'zh-TW': '瑞典', ar: 'السويد' } },
  CH: { code: 'CH', names: { en: 'Switzerland', fr: 'Suisse', sv: 'Schweiz', no: 'Sveits', da: 'Schweiz', fi: 'Sveitsi', ja: 'スイス', ko: '스위스', 'zh-CN': '瑞士', 'zh-TW': '瑞士', ar: 'سويسرا' } },
  SY: { code: 'SY', names: { en: 'Syria', fr: 'Syrie', sv: 'Syrien', no: 'Syria', da: 'Syrien', fi: 'Syyria', ja: 'シリア', ko: '시리아', 'zh-CN': '叙利亚', 'zh-TW': '敘利亞', ar: 'سوريا' } },
  TW: { code: 'TW', names: { en: 'Taiwan', fr: 'Taïwan', sv: 'Taiwan', no: 'Taiwan', da: 'Taiwan', fi: 'Taiwan', ja: '台湾', ko: '대만', 'zh-CN': '台湾', 'zh-TW': '臺灣', ar: 'تايوان' } },
  TZ: { code: 'TZ', names: { en: 'Tanzania', fr: 'Tanzanie', sv: 'Tanzania', no: 'Tanzania', da: 'Tanzania', fi: 'Tansania', ja: 'タンザニア', ko: '탄자니아', 'zh-CN': '坦桑尼亚', 'zh-TW': '坦尚尼亞', ar: 'تنزانيا' } },
  TH: { code: 'TH', names: { en: 'Thailand', fr: 'Thaïlande', sv: 'Thailand', no: 'Thailand', da: 'Thailand', fi: 'Thaimaa', ja: 'タイ', ko: '태국', 'zh-CN': '泰国', 'zh-TW': '泰國', ar: 'تايلاند' } },
  TG: { code: 'TG', names: { en: 'Togo', fr: 'Togo', sv: 'Togo', no: 'Togo', da: 'Togo', fi: 'Togo', ja: 'トーゴ', ko: '토고', 'zh-CN': '多哥', 'zh-TW': '多哥', ar: 'توغو' } },
  TN: { code: 'TN', names: { en: 'Tunisia', fr: 'Tunisie', sv: 'Tunisien', no: 'Tunisia', da: 'Tunesien', fi: 'Tunisia', ja: 'チュニジア', ko: '튀니지', 'zh-CN': '突尼斯', 'zh-TW': '突尼西亞', ar: 'تونس' } },
  TR: { code: 'TR', names: { en: 'Turkey', fr: 'Turquie', sv: 'Turkiet', no: 'Tyrkia', da: 'Tyrkiet', fi: 'Turkki', ja: 'トルコ', ko: '터키', 'zh-CN': '土耳其', 'zh-TW': '土耳其', ar: 'تركيا' } },
  UG: { code: 'UG', names: { en: 'Uganda', fr: 'Ouganda', sv: 'Uganda', no: 'Uganda', da: 'Uganda', fi: 'Uganda', ja: 'ウガンダ', ko: '우간다', 'zh-CN': '乌干达', 'zh-TW': '烏干達', ar: 'أوغندا' } },
  UA: { code: 'UA', names: { en: 'Ukraine', fr: 'Ukraine', sv: 'Ukraina', no: 'Ukraina', da: 'Ukraine', fi: 'Ukraina', ja: 'ウクライナ', ko: '우크라이나', 'zh-CN': '乌克兰', 'zh-TW': '烏克蘭', ar: 'أوكرانيا' } },
  AE: { code: 'AE', names: { en: 'United Arab Emirates', fr: 'Émirats arabes unis', sv: 'Förenade Arabemiraten', no: 'De forente arabiske emirater', da: 'De Forenede Arabiske Emirater', fi: 'Arabiemiirikunnat', ja: 'アラブ首長国連邦', ko: '아랍에미리트', 'zh-CN': '阿联酋', 'zh-TW': '阿拉伯聯合大公國', ar: 'الإمارات العربية المتحدة' } },
  GB: { code: 'GB', names: { en: 'United Kingdom', fr: 'Royaume-Uni', sv: 'Storbritannien', no: 'Storbritannia', da: 'Storbritannien', fi: 'Iso-Britannia', ja: 'イギリス', ko: '영국', 'zh-CN': '英国', 'zh-TW': '英國', ar: 'المملكة المتحدة' } },
  US: { code: 'US', names: { en: 'United States', fr: 'États-Unis', sv: 'USA', no: 'USA', da: 'USA', fi: 'Yhdysvallat', ja: 'アメリカ', ko: '미국', 'zh-CN': '美国', 'zh-TW': '美國', ar: 'الولايات المتحدة' } },
  UY: { code: 'UY', names: { en: 'Uruguay', fr: 'Uruguay', sv: 'Uruguay', no: 'Uruguay', da: 'Uruguay', fi: 'Uruguay', ja: 'ウルグアイ', ko: '우루과이', 'zh-CN': '乌拉圭', 'zh-TW': '烏拉圭', ar: 'أوروغواي' } },
  UZ: { code: 'UZ', names: { en: 'Uzbekistan', fr: 'Ouzbékistan', sv: 'Uzbekistan', no: 'Usbekistan', da: 'Usbekistan', fi: 'Uzbekistan', ja: 'ウズベキスタン', ko: '우즈베키스탄', 'zh-CN': '乌兹别克斯坦', 'zh-TW': '烏茲別克', ar: 'أوزبكستان' } },
  VE: { code: 'VE', names: { en: 'Venezuela', fr: 'Venezuela', sv: 'Venezuela', no: 'Venezuela', da: 'Venezuela', fi: 'Venezuela', ja: 'ベネズエラ', ko: '베네수엘라', 'zh-CN': '委内瑞拉', 'zh-TW': '委內瑞拉', ar: 'فنزويلا' } },
  VN: { code: 'VN', names: { en: 'Vietnam', fr: 'Vietnam', sv: 'Vietnam', no: 'Vietnam', da: 'Vietnam', fi: 'Vietnam', ja: 'ベトナム', ko: '베트남', 'zh-CN': '越南', 'zh-TW': '越南', ar: 'فيتنام' } },
  YE: { code: 'YE', names: { en: 'Yemen', fr: 'Yémen', sv: 'Jemen', no: 'Jemen', da: 'Yemen', fi: 'Jemen', ja: 'イエメン', ko: '예멘', 'zh-CN': '也门', 'zh-TW': '葉門', ar: 'اليمن' } },
  ZM: { code: 'ZM', names: { en: 'Zambia', fr: 'Zambie', sv: 'Zambia', no: 'Zambia', da: 'Zambia', fi: 'Sambia', ja: 'ザンビア', ko: '잠비아', 'zh-CN': '赞比亚', 'zh-TW': '尚比亞', ar: 'زامبيا' } },
  ZW: { code: 'ZW', names: { en: 'Zimbabwe', fr: 'Zimbabwe', sv: 'Zimbabwe', no: 'Zimbabwe', da: 'Zimbabwe', fi: 'Zimbabwe', ja: 'ジンバブエ', ko: '짐바브웨', 'zh-CN': '津巴布韦', 'zh-TW': '辛巴威', ar: 'زيمبابوي' } },
  // French territories
  GP: { code: 'GP', names: { en: 'Guadeloupe', fr: 'Guadeloupe', sv: 'Guadeloupe', no: 'Guadeloupe', da: 'Guadeloupe', fi: 'Guadeloupe', ja: 'グアドループ', ko: '과들루프', 'zh-CN': '瓜德罗普', 'zh-TW': '瓜德羅普', ar: 'غوادلوب' } },
  MQ: { code: 'MQ', names: { en: 'Martinique', fr: 'Martinique', sv: 'Martinique', no: 'Martinique', da: 'Martinique', fi: 'Martinique', ja: 'マルティニーク', ko: '마르티니크', 'zh-CN': '马提尼克', 'zh-TW': '馬提尼克', ar: 'مارتينيك' } },
  GF: { code: 'GF', names: { en: 'French Guiana', fr: 'Guyane française', sv: 'Franska Guyana', no: 'Fransk Guyana', da: 'Fransk Guyana', fi: 'Ranskan Guayana', ja: 'フランス領ギアナ', ko: '프랑스령 기아나', 'zh-CN': '法属圭亚那', 'zh-TW': '法屬圭亞那', ar: 'غويانا الفرنسية' } },
  RE: { code: 'RE', names: { en: 'Réunion', fr: 'La Réunion', sv: 'Réunion', no: 'Réunion', da: 'Réunion', fi: 'Réunion', ja: 'レユニオン', ko: '레위니옹', 'zh-CN': '留尼汪', 'zh-TW': '留尼旺', ar: 'ريونيون' } },
  YT: { code: 'YT', names: { en: 'Mayotte', fr: 'Mayotte', sv: 'Mayotte', no: 'Mayotte', da: 'Mayotte', fi: 'Mayotte', ja: 'マヨット', ko: '마요트', 'zh-CN': '马约特', 'zh-TW': '馬約特', ar: 'مايوت' } },
  NC: { code: 'NC', names: { en: 'New Caledonia', fr: 'Nouvelle-Calédonie', sv: 'Nya Kaledonien', no: 'Ny-Caledonia', da: 'Ny Kaledonien', fi: 'Uusi-Kaledonia', ja: 'ニューカレドニア', ko: '뉴칼레도니아', 'zh-CN': '新喀里多尼亚', 'zh-TW': '新喀里多尼亞', ar: 'كاليدونيا الجديدة' } },
  PF: { code: 'PF', names: { en: 'French Polynesia', fr: 'Polynésie française', sv: 'Franska Polynesien', no: 'Fransk Polynesia', da: 'Fransk Polynesien', fi: 'Ranskan Polynesia', ja: 'フランス領ポリネシア', ko: '프랑스령 폴리네시아', 'zh-CN': '法属波利尼西亚', 'zh-TW': '法屬玻里尼西亞', ar: 'بولينيزيا الفرنسية' } },
  PR: { code: 'PR', names: { en: 'Puerto Rico', fr: 'Porto Rico', sv: 'Puerto Rico', no: 'Puerto Rico', da: 'Puerto Rico', fi: 'Puerto Rico', ja: 'プエルトリコ', ko: '푸에르토리코', 'zh-CN': '波多黎各', 'zh-TW': '波多黎各', ar: 'بورتوريكو' } },
};

/**
 * Get country name by code in specified language
 * @param code - ISO 3166-1 alpha-2 country code
 * @param locale - Language code (defaults to 'fr')
 */
export function getCountryName(code: string, locale: SupportedLocale = 'fr'): string {
  const country = COUNTRIES[code.toUpperCase()];
  if (!country) return code;
  return country.names[locale] || country.names.en || code;
}

/**
 * Get country by code
 * @param code - ISO 3166-1 alpha-2 country code
 */
export function getCountry(code: string): Country | undefined {
  return COUNTRIES[code.toUpperCase()];
}

/**
 * Search countries by name in specified language
 * @param query - Search query
 * @param locale - Language to search in
 */
export function searchCountries(query: string, locale: SupportedLocale = 'fr'): Country[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(COUNTRIES).filter(country => {
    const name = country.names[locale] || country.names.en;
    return name.toLowerCase().includes(lowerQuery) || 
           country.code.toLowerCase().includes(lowerQuery);
  });
}

/**
 * Get all countries as array
 */
export function getAllCountries(): Country[] {
  return Object.values(COUNTRIES);
}
