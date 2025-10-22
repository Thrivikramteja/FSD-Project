import Header from "../components/header";
import Footer from "../components/footer";
import { headerConfig } from "../config/headerConfig";

export default function DiscoverPage() {
    return (
        <div>
            <Header navItems={headerConfig.landing} />
            <Footer></Footer>
        </div>
    );
}