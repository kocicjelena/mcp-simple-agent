
// import Image from "next/image";
// import styles from "@/page.module.css";
// import Link from "next/link";
// import chatWithFunTools from "@/lib/helper/npmChatTool";
// import ChatToolForm from "@/components/forms/Chat";
// import OptionModel from "@/components/ui/Nav/OptionModel";
// import ChatToolForm2 from "@/components/ChatToolForm2";
// import ChatForm from "@/components/ChatForm";
import MyNav from "@/components/ui/Nav/Wrap";
import ToolPage from "./tool-test/page";
//import ChatStreamForm from "@/components/ChatStreamForm/Wrap";

const Home = () => {
  return (
    <>
    <MyNav>
      <ToolPage />
    </MyNav>
     </>
  );
}
export default Home;