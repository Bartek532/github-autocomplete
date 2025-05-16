import { Autocomplete } from "@/components/autocomplete";

export default async function Home() {
  return <main className="flex flex-col items-center justify-start py-20 h-screen">
    <Autocomplete />
  </main>;
}
