export function PromoBanner() {
  return (
    <div class="flex flex-col md:flex-row bg-[#fcca0a] rounded-xl overflow-hidden shadow-sm border border-[#e5b607] w-full text-black transform hover:scale-[1.005] transition-transform relative mb-8">
      {/* Background pattern */}
      <div
        class="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div class="md:w-1/4 relative min-h-[85px] overflow-hidden bg-black flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black">
        <img
          src="https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&q=80&w=600"
          alt="Device Repair"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover opacity-70"
        />
      </div>

      <div class="md:w-3/4 p-4 md:p-6 flex flex-col justify-center relative z-20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 h-full">
          <div class="flex flex-col justify-center">
            <h2 class="text-xl font-black uppercase tracking-tight text-black flex flex-col gap-0.5 leading-none mb-1.5">
              <span class="bg-black text-white px-2 py-1 w-fit -rotate-1 shadow-sm leading-none">
                BRING YOUR DEVICE
              </span>
              <span class="inline-block w-fit px-1 leading-none mt-1">
                BACK TO LIFE
              </span>
            </h2>
            <p class="text-black font-bold italic text-sm">
              "Our prices are lower than your expectations."
            </p>
          </div>

          <div class="flex flex-row items-center gap-4 shrink-0">
            <a
              href="/repairs/book"
              class="px-5 py-2.5 bg-black text-[#fcca0a] text-xs font-bold uppercase tracking-wider rounded-sm hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)] transition-all flex items-center gap-2"
            >
              <svg
                class="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
              Book a Repair Now
            </a>

            <a
              href="/services/repairs"
              class="text-black font-bold text-xs uppercase tracking-wider hover:opacity-70 transition-opacity whitespace-nowrap underline underline-offset-2 decoration-2"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
