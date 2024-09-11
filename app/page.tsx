import ChatBot from "@/chatBot/page";
import NavBar from "@/components/navBar";


export default function Home() {

  return (
    <main className="">
      <div>
        <NavBar></NavBar>
        <div className="bg-arcon-green flex justify-center py-36 h-screen">
        <ChatBot></ChatBot>
        </div>
      </div>
    </main>
  );
}
