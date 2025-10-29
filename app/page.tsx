import dynamic from "next/dynamic";

const BranchMap = dynamic(() => import("../components/BranchMap"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <BranchMap />
    </div>
  );
}

