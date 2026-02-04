import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Image
        src="/podekia-logo.png"
        alt="Podekia Savings Club Logo"
        width={350}
        height={350}
        className="mb-6"
      />  
      <p className="text-4xl text-slate-800 font-bold">Welcome to the club</p>
      <p className="text-slate-600">Not sure how to access the system? Contact the Club Committee</p>
    </main>
  );
}
