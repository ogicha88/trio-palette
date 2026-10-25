import type { Trio } from "../lib/color";
import type { TasteId } from "./tastes";

export type Palette = {
  id: string;
  title: string;
  colors: Trio;
  names: [string, string, string];
  tastes: TasteId[];
  keywords: string[];
};

// [id, title, "HEX 名前 / HEX 名前 / HEX 名前", tastes, keywords]
const RAW: [string, string, string, string, string][] = [
  ["school-fes", "スクールフェス", "EFF55F レモンイエロー / 2C64B1 コバルトブルー / CE2B7E ラズベリーピンク", "casual,pop,street", "学校,文化祭,学生,イベント,ファッション"],
  ["cafe-open", "カフェオープン", "F9D6B8 ピーチベージュ / 18189A ディープブルー / EE470F バーミリオン", "modern,retro", "カフェ,オープン,飲食,アート"],
  ["pinky-store", "ピンキーストア", "E78195 ローズピンク / E03442 クリムゾンレッド / 5FA8EC スカイブルー", "cute,pop", "雑貨,ショップ,女の子,ギフト"],
  ["ice-cream", "アイスクリーム", "E83B2A ポピーレッド / B0DDE0 ペールアクア / FFD600 サンシャインイエロー", "pop,fresh", "アイス,夏,スイーツ,オープン,フード"],
  ["it-fes", "ITフェス", "F7F8F7 オフホワイト / 1E3ECF ロイヤルブルー / CBF22E ライムグリーン", "tech,modern", "IT,テック,カンファレンス,イベント,未来"],
  ["forest-picnic", "フォレストピクニック", "FFF4E0 クリーム / 2E7D5B フォレストグリーン / F28C28 タンジェリン", "casual,natural", "アウトドア,キャンプ,ピクニック,秋"],
  ["denim-coral", "デニムコーラル", "F6F1E9 オートミール / 3D5A80 デニムブルー / EE6C4D コーラル", "casual,modern", "アパレル,日常,ブログ,ライフスタイル"],
  ["mint-mustard", "ミントマスタード", "FDF6EC ミルク / 7FB77E ミントグリーン / F7D060 マスタード", "casual,fresh,natural", "パン,ベーカリー,春,子ども"],
  ["tomato-sand", "トマトサンド", "EAE7DC グレージュ / D8C3A5 サンド / E85A4F トマトレッド", "casual,retro", "ランチ,食堂,ハンバーガー,フード"],
  ["strawberry-milk", "いちごミルク", "FFE5EC ベビーピンク / FFB3C6 チェリーブロッサム / FB6F92 ストロベリー", "cute", "いちご,スイーツ,春,バレンタイン,女の子"],
  ["dreamy", "ドリーミー", "FDE2E4 シェルピンク / CDB4DB ラベンダー / A2D2FF パウダーブルー", "cute,fresh", "ゆめかわ,コスメ,ベビー,パステル"],
  ["melon-soda", "メロンソーダ", "FFF1C1 バニラ / FF9AA2 サーモンピンク / B5EAD7 ミント", "cute,pop,retro", "喫茶,ドリンク,パステル,夏"],
  ["mauve-dusk", "モーヴダスク", "FAE3E3 ミルキーピンク / 9A8C98 モーヴグレー / 4A4E69 ダスクネイビー", "cute,elegant", "美容,サロン,大人かわいい,ネイル"],
  ["sherbet", "シャーベット", "FFD6E0 ピーチピンク / FFEF9F レモンシフォン / C1FBA4 ライムクリーム", "cute,pop,fresh", "春,子ども,イースター,パステル"],
  ["swiss-orange", "スイスオレンジ", "F2F2F2 ライトグレー / 111111 ブラック / FF4F00 インターナショナルオレンジ", "modern,cool,street", "建築,デザイン,スタートアップ,展示"],
  ["signal", "シグナル", "EDEDE9 ストーン / 2B2D42 チャコールネイビー / EF233C シグナルレッド", "modern,cool", "ビジネス,セミナー,採用,コーポレート"],
  ["saffron-teal", "サフランティール", "F5F3EE アイボリー / 1F4E5F ディープティール / E9C46A サフラン", "modern,natural,elegant", "ホテル,インテリア,建築,旅行"],
  ["neon-indigo", "ネオンインディゴ", "E9ECEF クラウドグレー / 3A0CA3 インディゴ / F72585 ネオンピンク", "modern,tech,street", "音楽,ゲーム,配信,クラブ"],
  ["candy-pop", "キャンディポップ", "FFE600 ビビッドイエロー / FF3EA5 ショッキングピンク / 00B2FF シアン", "pop,street", "セール,おもちゃ,キャンペーン,夏"],
  ["marine-orange", "マリンオレンジ", "F7C59F アプリコット / 004E89 マリンブルー / FF6B35 オレンジ", "pop,casual,retro", "海,夏,スポーツ,キッズ"],
  ["watermelon", "ウォーターメロン", "FFD166 マリーゴールド / 06D6A0 エメラルドミント / EF476F ウォーターメロン", "pop,fresh", "フルーツ,夏,フェス,ドリンク"],
  ["grape-soda", "グレープソーダ", "FEE440 レモン / 9B5DE5 グレープ / F15BB5 マゼンタ", "pop,street", "ゲーム,ライブ,ハロウィン,エンタメ"],
  ["champagne", "シャンパン", "F4EDE4 シルク / 8C6A5D モカ / C9A66B シャンパンゴールド", "elegant,luxury", "ウェディング,ホテル,美容,ギフト"],
  ["bordeaux-rose", "ボルドーローズ", "F8F4F0 パール / 6D2E46 ボルドー / D5B9B2 ダスティローズ", "elegant,cute,luxury", "ワイン,秋冬,ブライダル,コスメ"],
  ["sage-gold", "セージゴールド", "EEF0EB セージホワイト / 3E5C50 ディープセージ / B89F74 アンティークゴールド", "elegant,natural", "スパ,ボタニカル,ホテル,アロマ"],
  ["night-plum", "ナイトプラム", "F5E6E8 ブラッシュ / 2F2440 ナイトプラム / C6B9CD ライラックグレー", "elegant,cool", "香水,バー,夜,ジュエリー"],
  ["terracotta", "テラコッタ", "EDE6D6 リネン / 6B8F71 セージグリーン / A47148 テラコッタ", "natural", "インテリア,植物,陶器,暮らし"],
  ["peach-olive", "ピーチオリーブ", "F3EFE0 ライスペーパー / 99B898 オリーブリーフ / E8A87C ピーチ", "natural,casual,cute", "オーガニック,カフェ,ヨガ,春"],
  ["walnut-moss", "ウォルナットモス", "E6DCCB ラテ / 5C4033 ウォルナット / 8FA67A モス", "natural,retro", "家具,木工,コーヒー,秋"],
  ["pistachio", "ピスタチオ", "DDE5B6 ペールリーフ / 6C584C ココア / ADC178 ピスタチオ", "natural,cute", "焼き菓子,ナッツ,マルシェ,ヴィーガン"],
  ["sepia-teal", "セピアティール", "F1E3C8 セピアクリーム / 00798C ティールブルー / D1495B ローズレッド", "retro,pop", "昭和,喫茶,レコード,映画"],
  ["seventies", "セブンティーズ", "F4E1C1 ヴィンテージペーパー / 3D405B スレートネイビー / E07A5F バーントオレンジ", "retro,casual", "古着,70年代,ラジオ,ポスター"],
  ["sunset-diner", "サンセットダイナー", "E9C46A マスタード / 2A9D8F ペトロール / E76F51 バーントシエナ", "retro,pop", "ダイナー,アメリカン,夕焼け,バーガー"],
  ["antique-wine", "アンティークワイン", "FAEBD7 アンティークホワイト / 8B1E3F ワインレッド / D4A373 キャメル", "retro,elegant", "洋館,クラシック,本,バー"],
  ["midnight-teal", "ミッドナイトティール", "0B132B ミッドナイト / 3A506B スチールブルー / 5BC0BE ターコイズ", "cool,tech", "夜,ネットワーク,SaaS,データ"],
  ["onyx-ice", "オニキスアイス", "EDF2F4 アイスホワイト / 1B1B1E オニキス / 8D99AE クールグレー", "cool,minimal", "メンズ,時計,ガジェット,冬"],
  ["frost-storm", "フロストストーム", "E0E1DD フロスト / 0D1B2A ディープネイビー / 415A77 ストームブルー", "cool,minimal,modern", "金融,コンサル,冬,コーポレート"],
  ["amber-oxford", "アンバーオックスフォード", "E5E5E5 プラチナ / 14213D オックスフォードブルー / FCA311 アンバー", "cool,modern", "建設,物流,車,スポーツ"],
  ["sumi", "スミクロ", "FAFAFA スノー / 222222 スミクロ / D6D6D6 シルバーグレー", "minimal", "ポートフォリオ,写真,ギャラリー,建築"],
  ["pebble", "ペブル", "F7F7F2 チョーク / 4F5D75 ブルーグレー / BFC0C0 ペブル", "minimal,cool", "家電,文具,シンプル,北欧"],
  ["one-red", "ワンレッド", "FFFFFF ホワイト / C44536 レッドアクセント / E8E4DE ベージュグレー", "minimal,modern", "展示会,ミュージアム,ブランド,本"],
  ["taupe", "トープ", "F2F0EB オフホワイト / 2D2D2A チャコール / 9A8F80 トープ", "minimal,natural,elegant", "アパレル,ライフスタイル,器,ホテル"],
  ["ai-shu", "藍と朱", "F7F1E5 生成り / 2B4C7E 藍色 / C73E3A 朱色", "japanese,retro", "和食,神社,祭り,伝統"],
  ["matsuba", "松葉と弁柄", "EEE7D7 練色 / 5B6E4F 松葉色 / B7472A 弁柄色", "japanese,natural", "旅館,抹茶,和菓子,秋"],
  ["sakura", "桜と紺鼠", "FCF5F3 白練 / 3F4B62 紺鼠 / EBB7B7 桜色", "japanese,cute,elegant", "春,花見,着物,和雑貨"],
  ["urushi", "漆と金茶", "1C1C1C 漆黒 / B8860B 金茶 / 8E2F2F 臙脂", "japanese,luxury", "料亭,日本酒,工芸,正月"],
  ["seiji", "青磁と山吹", "E8E1D1 砂色 / 6A8D92 青磁色 / D9A441 山吹色", "japanese,natural,elegant", "器,茶,工芸,旅"],
  ["neon-street", "ネオンストリート", "111111 ブラック / 08D9D6 ネオンシアン / FF2E63 ネオンレッド", "street,cool,tech", "クラブ,夜,ゲーム,ライブ"],
  ["concrete-blaze", "コンクリートブレイズ", "F5F5F5 コンクリート / 2B2B2B グラファイト / FF5F1F ブレイズオレンジ", "street,modern", "スニーカー,スケート,スポーツ,DIY"],
  ["skate-blue", "スケートブルー", "FFBE0B イエロー / 3A86FF ブライトブルー / FB5607 オレンジ", "street,pop", "スポーツ,キッズ,フェス,夏"],
  ["hot-night", "ホットナイト", "F5F5F5 ホワイト / 1A1A2E ナイトブルー / E94560 ホットピンク", "street,cool,modern", "ライブ,音楽,ダンス,バー"],
  ["slate-lime", "スレートライム", "0F172A スレート / 38BDF8 スカイ / A3E635 ライム", "tech,cool", "SaaS,アプリ,AI,スタートアップ"],
  ["indigo-cyan", "インディゴシアン", "F8FAFC ゴーストホワイト / 6366F1 インディゴブルー / 22D3EE エレクトリックシアン", "tech,modern", "AI,Webサービス,ハッカソン,教育"],
  ["deep-space", "ディープスペース", "0A0F1F ディープスペース / 7C3AED バイオレット / 2DD4BF ミントシアン", "tech,cool", "宇宙,Web3,ゲーム,SF"],
  ["blue-orange", "ブルーオレンジ", "EEF2FF ラベンダーホワイト / 1D4ED8 ブルー / F97316 オレンジ", "tech,casual,modern", "スクール,プログラミング,採用,セミナー"],
  ["jet-gold", "ジェットゴールド", "0E0E0E ジェットブラック / F5F0E6 シャンパン / C9A227 ゴールド", "luxury,elegant", "ジュエリー,ホテル,ウイスキー,記念日"],
  ["forest-gold", "フォレストゴールド", "F3EFE6 クリーム / 123524 フォレスト / D4AF37 メタリックゴールド", "luxury,elegant,natural", "ゴルフ,ホテル,紅茶,クリスマス"],
  ["deep-wine", "ディープワイン", "E6C9A8 ヌード / 3B0A20 ディープワイン / 1A1A1A ブラック", "luxury,elegant", "コスメ,香水,ワイン,夜"],
  ["royal-bronze", "ロイヤルブロンズ", "EFE9DD アイボリー / 1C2541 ロイヤルネイビー / B08D57 ブロンズ", "luxury,elegant,modern", "不動産,時計,法律事務所,招待状"],
  ["lagoon", "ラグーン", "DFF6F0 ミントホワイト / 46CDCF ラグーン / FFB400 マンゴー", "fresh,pop", "南国,ビーチ,夏,ジュース"],
  ["citrus", "シトラス", "FFFBEA レモンクリーム / 8AC926 ライムグリーン / FF595E グレープフルーツ", "fresh,pop,casual", "フルーツ,スムージー,ヘルシー,夏"],
  ["sea-foam", "シーフォーム", "E3F6F5 シーフォーム / 2EC4B6 ティファニーブルー / FF9F1C オレンジ", "fresh,casual", "海,プール,夏休み,アウトドア"],
  ["cherry-aqua", "チェリーアクア", "F1FAEE ホワイトミント / E63946 チェリーレッド / A8DADC パウダーアクア", "fresh,cute,retro", "さくらんぼ,初夏,ソーダ,パン"],
];

export const PALETTES: Palette[] = RAW.map(([id, title, colorStr, tastes, keywords]) => {
  const parts = colorStr.split(" / ").map((p) => {
    const [hex, ...name] = p.split(" ");
    return { hex: `#${hex}`, name: name.join(" ") };
  });
  return {
    id,
    title,
    colors: parts.map((p) => p.hex) as Trio,
    names: parts.map((p) => p.name) as [string, string, string],
    tastes: tastes.split(",") as TasteId[],
    keywords: keywords.split(","),
  };
});

export const PALETTE_MAP = Object.fromEntries(PALETTES.map((p) => [p.id, p]));
