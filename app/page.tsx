import ChatBot from "@/chatBot/page";
import NavBar from "@/components/navBar";


export default function Home() {

  return (
    <main className="">
      <div className="">
        <NavBar></NavBar>
        <div className="flex justify-center py-36">
        <ChatBot></ChatBot>
        </div>
      </div>
    </main>
  );
}
