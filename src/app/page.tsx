import HomePage from "@/views/Home/HomePage";

export const metadata = {
  itunes: { appId: "6787519258", appArgument: "https://sercio.com.ar/" },
};

export const revalidate = 300;

export default function Page() {
  return <HomePage />;
}
