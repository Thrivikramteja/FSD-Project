import Header from "../components/header";
import Footer from "../components/footer";
import Carousel from "../components/carousel";
import FAQ from "../components/faq"
import { headerConfig } from "../config/headerConfig";

export default function LandingPage() {
  return (
    <div>
      <Header navItems={headerConfig.landing} />
      <main>
        <Carousel></Carousel>
        <FAQ></FAQ>
      </main>
      <Footer></Footer>
    </div>
  );
}
