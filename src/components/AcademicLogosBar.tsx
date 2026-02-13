import harvardLogo from "@/assets/harvard-center-logo.png";
import stanfordLogo from "@/assets/stanford-university-logo.png";

const AcademicLogosBar = () => {
  return (
    <div className="flex items-center justify-center gap-5 mb-6 opacity-60">
      <span className="text-lg">🏆</span>
      <img src={harvardLogo} alt="Harvard" className="h-7 object-contain grayscale" />
      <img src={stanfordLogo} alt="Stanford" className="h-7 object-contain grayscale" />
    </div>
  );
};

export default AcademicLogosBar;
