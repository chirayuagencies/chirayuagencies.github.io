const Contact = () => (
  <section id="contact" className="min-h-screen py-12 px-4 sm:px-8 md:px-16">
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Email</h2>
            <a href="mailto:info@chirayuagencies.com" className="text-blue-600 hover:underline">
              info@chirayuagencies.com
            </a>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Phone</h2>
            <a href="tel:+919229177749" className="text-blue-600 hover:underline">
              +91-9229177749
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
);
export default Contact;
