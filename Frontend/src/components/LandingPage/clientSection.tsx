

const ClientsSection = () => {
  // Client logos - update `logo` paths to match files in /public/logos
  const clients = [
    { name: 'Apple', logo: '/logos/apple.png' },
    { name: 'Aditya Birla', logo: '/logos/aditya-birla.png' },
    { name: 'Bajaj Finserv', logo: '/logos/bajaj-finserv.png' },
    { name: 'Bosch', logo: '/logos/bosch.png' },
    { name: 'Calendly', logo: '/logos/calendly.png' },
    { name: 'Canva', logo: '/logos/canva.png' },
    { name: 'Chola', logo: '/logos/chola.png' },
    { name: 'Deloitte', logo: '/logos/deloitte.png' },
    { name: 'GE Aerospace', logo: '/logos/ge.png' },
    { name: 'Google', logo: '/logos/google.png' },
    { name: 'HP', logo: '/logos/hp.png' },
    { name: 'HSBC', logo: '/logos/hsbc.png' },
    { name: 'HubSpot', logo: '/logos/hubspot2.png' },
    { name: 'IBM', logo: '/logos/ibm.png' },
    { name: 'ICICI Bank', logo: '/logos/icici.png' },
    { name: 'IDFC Bank', logo: '/logos/idfc.png' },
    { name: 'Indian Overseas', logo: '/logos/indian-overseas.png' },
    { name: 'JP Morgan Chase', logo: '/logos/jp-morgan-chase.png' },
    { name: 'Kotak Mahindra Bank', logo: '/logos/kotak.png' },
    { name: 'L&T Finance', logo: '/logos/L&T.png' },
    { name: 'Muthoot Finance', logo: '/logos/muthoot-finance.png' },
    { name: 'Paypal', logo: '/logos/paypal.png' },
    { name: 'SalesForce', logo: '/logos/salesforce.png' },
    { name: 'Stripe', logo: '/logos/stripe.png' },
    { name: 'Tata Steel', logo: '/logos/tata-steek.png' },
    { name: 'Unilever', logo: '/logos/uniliever.png' },
    { name: 'United Health', logo: '/logos/united-health.png' },
    { name: 'Yes Bank', logo: '/logos/yes-bank.png' },
  ];

  return (
    <section className="py-16 lg:py-24 bg-gray-100 overflow-hidden">
      <div className="container mx-auto px-4 mb-12">
        <div className="text-center">
         
          <h2 className="heading">
            Trusted by Leading Enterprises Across Industries
          </h2>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-card to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-card to-transparent z-10" />

        {/* First Row - Left to Right */}
        <div className="flex animate-marquee mb-6">
          {[...clients, ...clients].map((client, index) => (
            <div
              key={index}
            >
              <div className="w-30 h-30 flex items-center justify-center overflow-hidden">
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-20 h-20 object-contain"
                  loading="lazy"
                />
              </div>
              {/* <span className="font-medium text-foreground whitespace-nowrap">{client.name}</span> */}
            </div>
          ))}
        </div>

        {/* Second Row - Right to Left */}
        <div className="flex animate-marquee" style={{ animationDirection: 'reverse', animationDuration: '35s' }}>
          {[...clients.slice().reverse(), ...clients.slice().reverse()].map((client, index) => (
            <div
              key={index}
             
            >
              <div className="w-30 h-30 flex items-center justify-center overflow-hidden">
                <img
                  src={client.logo}
                  alt={client.name}
                  className="w-20 h-20 object-contain"
                  loading="lazy"
                />
              </div>
              {/* <span className="font-medium text-foreground whitespace-nowrap">{client.name}</span> */}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="container border-t border-border mx-auto px-4 mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-4">
          {[
            { value: '10,000+', label: 'Active Users' },
            { value: '5M+', label: 'Documents Signed' },
            { value: '99.9%', label: 'Uptime' },
            { value: '150+', label: 'Countries Served' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary mb-1">
                {stat.value}
              </p>
              <p className="details-text">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientsSection;
