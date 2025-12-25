import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-8">
        <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary opacity-20 select-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-search text-6xl text-primary animate-bounce"></i>
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-4">
        الصفحة غير موجودة
      </h2>
      
      <p className="text-gray-400 max-w-md mb-8 text-lg">
        عذراً، الصفحة التي تبحث عنها غير موجودة. ربما تم نقلها أو حذفها، أو أن الرابط الذي استخدمته غير صحيح.
      </p>
      
      <Link 
        href="/"
        className="btn-primary inline-flex items-center gap-2 transition-transform hover:scale-105"
      >
        <i className="fas fa-home"></i>
        العودة للرئيسية
      </Link>
    </div>
  )
}
