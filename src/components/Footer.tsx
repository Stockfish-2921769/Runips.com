import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded flex items-center justify-center text-white text-xs font-bold">R</span>
            RunIPS — 早稻田大学教授人气榜
          </div>
          <div className="text-xs text-gray-400">
            <span>非官方学生项目 · 数据仅供参考</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
