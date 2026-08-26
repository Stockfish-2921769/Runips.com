// 31 位教授的 OpenAlex 作者映射 + 搜索关键词
// openalexId 为 null 表示"未定"（无匹配记录，前端显示"未定"）
export interface ProfessorMeta {
  id: number;
  openalexId: string | null;
  jaName: string;
  enName: string;
  jaLab: string | null;
}

export const PROFESSORS: ProfessorMeta[] = [
  { id: 1, openalexId: 'A5015913121', jaName: '藤村 茂', enName: 'Shigeru Fujimura', jaLab: 'スマートインダストリー研究室' },
  { id: 2, openalexId: 'A5100326923', jaName: '古月 敬之', enName: 'Takayuki Furuzuki', jaLab: 'ニューロコンピューティング研究室' },
  { id: 3, openalexId: 'A5047052126', jaName: '岩井原 瑞穂', enName: 'Mizuho Iwaihara', jaLab: 'データ工学研究室' },
  { id: 4, openalexId: 'A5066452160', jaName: '鎌田 清一郎', enName: 'Sei-ichiro Kamata', jaLab: 'イメージメディア研究室' },
  { id: 5, openalexId: 'A5080695008', jaName: '亀岡 遵', enName: 'Jun Kameoka', jaLab: 'バイオ情報センシング研究室' },
  { id: 6, openalexId: 'A5060121645', jaName: 'ルパージュ・イヴ', enName: 'Yves Lepage', jaLab: '用例翻訳・言語処理研究室' },
  { id: 7, openalexId: 'A5005634226', jaName: '松丸 隆文', enName: 'Takafumi Matsumaru', jaLab: 'バイオロボティクス&ヒューマン・メカトロニクス研究室' },
  { id: 8, openalexId: 'A5057487414', jaName: '吉江 修', enName: 'Osamu Yoshie', jaLab: 'コミュニティ・コンピューティング研究室' },
  { id: 9, openalexId: 'A5004673608', jaName: '伍 軍', enName: 'Jun Wu', jaLab: 'ネットワークインテリジェンスとセキュリティ研究室' },
  { id: 10, openalexId: 'A5005421825', jaName: '家入 祐也', enName: 'Yuya Ieiri', jaLab: 'ヒューマニティ中心インタラクション研究室' },
  { id: 11, openalexId: null, jaName: '荒川 雅生', enName: 'Masao Arakawa', jaLab: '設計工学システム研究室' },
  { id: 12, openalexId: 'A5007690546', jaName: '橋本 健二', enName: 'Kenji Hashimoto', jaLab: '移動ロボティクス・プラットフォーム研究室' },
  { id: 13, openalexId: 'A5033923183', jaName: '馬渡 和真', enName: 'Kazuma Mawatari', jaLab: 'マイクロナノ流体デバイス研究室' },
  { id: 14, openalexId: 'A5082894357', jaName: '三宅 丈雄', enName: 'Takeo Miyake', jaLab: 'バイオイオントロニクス研究室' },
  { id: 15, openalexId: 'A5112638971', jaName: '田中 英一郎', enName: 'Eiichiro Tanaka', jaLab: '機械システム設計研究室' },
  { id: 16, openalexId: 'A5003914299', jaName: '立野 繁之', enName: 'Shigeyuki Tateno', jaLab: '生産プロセス工学研究室' },
  { id: 17, openalexId: null, jaName: '植田 研二', enName: 'Kenji Ueda', jaLab: '知能半導体工学研究室' },
  { id: 18, openalexId: 'A5056128134', jaName: '志村 考功', enName: 'Takayoshi Shimura', jaLab: '半導体デバイス材料工学研究室' },
  { id: 19, openalexId: 'A5001203533', jaName: '高橋 淳子', enName: 'Junko Takahashi', jaLab: '生体医工学研究室' },
  { id: 20, openalexId: 'A5033606654', jaName: '山口 恭平', enName: 'Kyohei Yamaguchi', jaLab: 'パワートレインシステム研究室' },
  { id: 22, openalexId: 'A5048399196', jaName: '池橋 民雄', enName: 'Tamio Ikehashi', jaLab: 'マイクロ電気機械システム研究室' },
  { id: 23, openalexId: 'A5103206427', jaName: '池永 剛', enName: 'Takeshi Ikenaga', jaLab: '画像情報システム研究室' },
  { id: 24, openalexId: null, jaName: '硴塚 孝明', enName: 'Takaaki Kakitsuka', jaLab: '発光システム研究室' },
  { id: 25, openalexId: 'A5103496033', jaName: '木村 晋二', enName: 'Shinji Kimura', jaLab: '高位検証技術研究室' },
  { id: 26, openalexId: 'A5075702573', jaName: '牧野 昭二', enName: 'Shoji Makino', jaLab: '知的音響システム研究室' },
  { id: 27, openalexId: 'A5112243909', jaName: '髙畑 清人', enName: 'Kiyoto Takahata', jaLab: '光電子集積システム研究室' },
  { id: 28, openalexId: 'A5066755966', jaName: '丹沢 徹', enName: 'Toru Tanzawa', jaLab: 'グリーン集積システム研究室' },
  { id: 29, openalexId: null, jaName: '山﨑 慎太郎', enName: 'Shintaro Yamasaki', jaLab: '集積システム最適化研究室' },
  { id: 30, openalexId: 'A5043324722', jaName: '吉増 敏彦', enName: 'Toshihiko Yoshimasu', jaLab: '無線通信回路技術研究室' },
  { id: 31, openalexId: 'A5039260364', jaName: '芹田 和則', enName: 'Kazunori Serita', jaLab: 'テラヘルツ集積システム研究室' },
  { id: 32, openalexId: null, jaName: '董世杰', enName: 'Dong Shijie', jaLab: 'Hippo8!415' },
];
