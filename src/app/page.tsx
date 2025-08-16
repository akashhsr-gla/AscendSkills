import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturesGrid from "@/components/FeaturesGrid";
import AnalyticsPreview from "@/components/AnalyticsPreview";
import PricingSection from "@/components/PricingSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";

export const metadata = {
  title: 'Ascend Skills - Comprehensive Placement Preparation Platform',
  description: 'Master your placement journey with practice quizzes, mock interviews, coding challenges, and detailed analytics. Get real-time feedback and track your progress.',
  keywords: 'placement preparation, practice quizzes, mock interviews, coding challenges, analytics, student preparation',
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <Hero />
      
      {/* Features Section */}
      <FeaturesGrid />
      
      {/* Analytics Preview Section */}
      <AnalyticsPreview />
      
      {/* Pricing Section */}
      <PricingSection />
      
      {/* Testimonials Section */}
      <TestimonialsSection />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
