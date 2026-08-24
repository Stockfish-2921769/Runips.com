export interface ProfessorSeed {
  name: string;
  lab: string | null;
  division: '情報アーキテクチャ' | '生産システム' | '集積システム';
}

export const PROFESSOR_SEED: ProfessorSeed[] = [
  { name: '藤村 茂', lab: 'スマートインダストリー研究室', division: '情報アーキテクチャ' },
  { name: '古月 敬之', lab: 'ニューロコンピューティング研究室', division: '情報アーキテクチャ' },
  { name: '岩井原 瑞穂', lab: 'データ工学研究室', division: '情報アーキテクチャ' },
  { name: '鎌田 清一郎', lab: 'イメージメディア研究室', division: '情報アーキテクチャ' },
  { name: '亀岡 遵', lab: 'バイオ情報センシング研究室', division: '情報アーキテクチャ' },
  { name: 'ルパージュ・イヴ', lab: '用例翻訳・言語処理研究室', division: '情報アーキテクチャ' },
  { name: '松丸 隆文', lab: 'バイオロボティクス&ヒューマン・メカトロニクス研究室', division: '情報アーキテクチャ' },
  { name: '吉江 修', lab: 'コミュニティ・コンピューティング研究室', division: '情報アーキテクチャ' },
  { name: '伍 軍', lab: 'ネットワークインテリジェンスとセキュリティ研究室', division: '情報アーキテクチャ' },
  { name: '家入 祐也', lab: 'ヒューマニティ中心インタラクション研究室', division: '情報アーキテクチャ' },
  { name: '荒川 雅生', lab: '設計工学システム研究室', division: '生産システム' },
  { name: '橋本 健二', lab: '移動ロボティクス・プラットフォーム研究室', division: '生産システム' },
  { name: '馬渡 和真', lab: 'マイクロナノ流体デバイス研究室', division: '生産システム' },
  { name: '三宅 丈雄', lab: 'バイオイオントロニクス研究室', division: '生産システム' },
  { name: '田中 英一郎', lab: '機械システム設計研究室', division: '生産システム' },
  { name: '立野 繁之', lab: '生産プロセス工学研究室', division: '生産システム' },
  { name: '植田 研二', lab: '知能半導体工学研究室', division: '生産システム' },
  { name: '志村 考功', lab: '半導体デバイス材料工学研究室', division: '生産システム' },
  { name: '高橋 淳子', lab: '生体医工学研究室', division: '生産システム' },
  { name: '山口 恭平', lab: 'パワートレインシステム研究室', division: '生産システム' },
  { name: 'メーヘシュ ガーボル', lab: null, division: '生産システム' },
  { name: '池橋 民雄', lab: 'マイクロ電気機械システム研究室', division: '集積システム' },
  { name: '池永 剛', lab: '画像情報システム研究室', division: '集積システム' },
  { name: '硴塚 孝明', lab: '発光システム研究室', division: '集積システム' },
  { name: '木村 晋二', lab: '高位検証技術研究室', division: '集積システム' },
  { name: '牧野 昭二', lab: '知的音響システム研究室', division: '集積システム' },
  { name: '髙畑 清人', lab: '光電子集積システム研究室', division: '集積システム' },
  { name: '丹沢 徹', lab: 'グリーン集積システム研究室', division: '集積システム' },
  { name: '山﨑 慎太郎', lab: '集積システム最適化研究室', division: '集積システム' },
  { name: '吉増 敏彦', lab: '無線通信回路技術研究室', division: '集積システム' },
  { name: '芹田 和則', lab: 'テラヘルツ集積システム研究室', division: '集積システム' },
];
