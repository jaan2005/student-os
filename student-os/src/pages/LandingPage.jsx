import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import Features from '../components/Features.jsx'
import Roadmap from '../components/Roadmap.jsx'
import WhyChoose from '../components/WhyChoose.jsx'
import CTA from '../components/CTA.jsx'
import Footer from '../components/Footer.jsx'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Roadmap />
        <WhyChoose />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
