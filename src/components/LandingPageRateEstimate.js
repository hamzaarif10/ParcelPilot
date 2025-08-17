import RateEstimateForm from "./RateEstimateForm";

export default function PricingPage() {
    return (
      <div>

      {/* Breadcrumb */}
      <div 
        className="pp-breadcrumb-wrapper fix bg-cover" 
        style={{ backgroundImage: "url(assets/img/inner-page/breadcrumb2.webp)" }}
      >
        <div className="container">
          <div className="pp-page-heading">
            <div className="pp-breadcrumb-sub-title">
              <h1 className="wow fadeInUp" data-wow-delay=".3s">Rate Estimate</h1>
            </div>
            <ul className="pp-breadcrumb-items wow fadeInUp" data-wow-delay=".5s">
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <i className="fa-solid fa-chevron-right"></i>
              </li>
              <li>Rate Estimate</li>
            </ul>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="pp-about-section section-padding fix">
  
                   <RateEstimateForm/>

      </section>
      <div style={{height: '230px', position: 'relative', zIndex: 999}}>
    {/* empty */}
</div>
      </div>
  );
}