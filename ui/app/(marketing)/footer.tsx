import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Atom, BookOpen, Calculator, Globe, Laptop } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="hidden lg:block h-20 w-full border-t-2 border-slate-200 p-2">
      <div className="max-w-screen-lg mx-auto flex items-center justify-evenly h-full">
        <Button size="lg" variant="ghost" className="w-full">
          <BookOpen className="mr-4 h-8 w-8 text-orange-400" />
          English
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Atom className="mr-4 h-8 w-8 text-orange-400" />
          Science
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Calculator className="mr-4 h-8 w-8 text-orange-400" />
          Maths
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Globe className="mr-4 h-8 w-8 text-orange-400" />
          Social Science
        </Button>
        <Button size="lg" variant="ghost" className="w-full">
          <Laptop className="mr-4 h-8 w-8 text-orange-400" />
          Computer
        </Button>
      </div>
    </footer>
  );
};
