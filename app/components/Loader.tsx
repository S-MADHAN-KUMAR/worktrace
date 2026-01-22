const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-[#1F1F1F] rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-[#CCFF00] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-b-[#CCFF00] border-t-transparent border-r-transparent border-l-transparent rounded-full animate-spin-reverse opacity-50"></div>
      </div>
      <div className="font-mono text-[#CCFF00] text-sm animate-pulse">
        SYSTEM_BOOT://LOADING_ASSETS...
      </div>
    </div>
  );
}

export default Loader;
