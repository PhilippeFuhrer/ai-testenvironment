import ChatBot from "@/chatBot/page";
import NavBar from "@/components/navBar";


export default function Home() {

  return (
    <main className="">
      <div>
        <NavBar></NavBar>
        <div className="bg-gradient-to-r from-violet-200 to-pink-200 flex justify-center py-36">
        <ChatBot></ChatBot>
        </div>
      </div>
    </main>
  );
}
