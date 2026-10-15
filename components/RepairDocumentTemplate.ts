export function RepairDocumentTemplate(
  { ticket, type, qrCodeUrl: _qrCodeUrl, logoUrl }: {
    ticket: any;
    type: string;
    qrCodeUrl?: string;
    logoUrl: string;
  },
): string {
  const customerName = ticket.customer?.first_name
    ? `${ticket.customer.first_name} ${ticket.customer.last_name || ""}`.trim()
    : ticket.customer?.email || ticket.email || "";

  const formatAmount = (amt: number) => `KES ${(amt / 100).toFixed(2)}`;

  const totalNum = ticket.total_actual || ticket.total_estimate || 0;
  const total = formatAmount(totalNum);

  const balanceDueNum = ticket.status === "completed" ? 0 : totalNum;
  const balanceDue = formatAmount(balanceDueNum);

  const date = new Date(ticket.created_at || Date.now()).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );

  let title = "Repair Document";
  let headerValueLabel = "";
  let headerValue = "";
  let termsText = "";
  let footerText = "";

  if (type === "job_card") {
    title = "Job Card";
    headerValueLabel = "Status";
    headerValue = (ticket.status || "pending").toUpperCase();
    termsText = "Standard Intake";
    footerText = "Thanks for trusting us with your device.";
  } else if (type === "quote") {
    title = "Quotation";
    headerValueLabel = "Estimated Total";
    headerValue = total;
    termsText = "Valid for 14 days";
    footerText = "This is an estimate. Final costs may vary.";
  } else if (type === "invoice") {
    title = "Invoice";
    headerValueLabel = "Balance Due";
    headerValue = balanceDue;
    termsText = "Due on Receipt";
    footerText = "Thanks for your business.";
  } else if (type === "receipt") {
    title = "Receipt";
    headerValueLabel = "Amount Paid";
    headerValue = total;
    termsText = "Paid in Full";
    footerText = "Thanks for your business.";
  }

  const isJobCard = type === "job_card";
  const isReceipt = type === "receipt";

  let partsRowsHtml = "";
  if (ticket.parts && ticket.parts.length > 0) {
    partsRowsHtml = ticket.parts.map((p: any, idx: number) => `
      <tr class="border-b border-[#e5e7eb]">
        <td class="py-3.5 px-3 text-center">${idx + 1}</td>
        <td class="py-3.5 px-3">${p.title} ${
      p.product?.title ? `(${p.product.title})` : ""
    }</td>
        <td class="py-3.5 px-3 text-center">1.00</td>
        <td class="py-3.5 px-3 text-right">${
      formatAmount(p.price || p.estimated_price || 0)
    }</td>
        <td class="py-3.5 px-3 text-right">${
      formatAmount(p.price || p.estimated_price || 0)
    }</td>
      </tr>
    `).join("");
  } else {
    partsRowsHtml = `
      <tr class="border-b border-[#e5e7eb]">
        <td class="py-3.5 px-3 text-center">1</td>
        <td class="py-3.5 px-3">Standard Repair Service ${
      type === "quote" ? "(Estimate)" : ""
    }</td>
        <td class="py-3.5 px-3 text-center">1.00</td>
        <td class="py-3.5 px-3 text-right">${total}</td>
        <td class="py-3.5 px-3 text-right">${total}</td>
      </tr>
    `;
  }

  const dueDateHtml = !isJobCard
    ? `
    <div class="text-[#4b5563]">Due Date :</div>
    <div class="text-[#111827]">${date}</div>
  `
    : "";

  const jobCardDynamicHtml = `
    <div class="mb-16">
      <h4 class="font-semibold text-[#111827] mb-3 text-[12px]">Intake Assessment</h4>
      <table class="w-full text-[12px] border border-[#e5e7eb] rounded-lg overflow-hidden">
        <tbody class="divide-y divide-[#e5e7eb] text-[#1f2937]">
          <tr>
            <td class="py-3 px-4 font-semibold bg-[#f9fafb] w-1/3">Physical Condition</td>
            <td class="py-3 px-4">${
    ticket.physical_condition || "Not specified during intake."
  }</td>
          </tr>
          <tr>
            <td class="py-3 px-4 font-semibold bg-[#f9fafb]">Included Accessories</td>
            <td class="py-3 px-4">${ticket.accessories || "None"}</td>
          </tr>
          <tr>
            <td class="py-3 px-4 font-semibold bg-[#f9fafb]">Diagnostic Request</td>
            <td class="py-3 px-4">Standard full-device diagnostic authorized.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const financialDynamicHtml = `
    <table class="w-full mb-8 text-[12px]">
      <thead class="bg-[#3f3f3f] text-white">
        <tr>
          <th class="py-2.5 px-3 font-medium text-center w-12">#</th>
          <th class="py-2.5 px-3 font-medium text-left">Description</th>
          <th class="py-2.5 px-3 font-medium text-center w-24">Qty</th>
          <th class="py-2.5 px-3 font-medium text-right w-24">Rate</th>
          <th class="py-2.5 px-3 font-medium text-right w-24">Amount</th>
        </tr>
      </thead>
      <tbody class="text-[#1f2937]">
        ${partsRowsHtml}
      </tbody>
    </table>

    <div class="flex justify-end mb-16">
      <div class="w-[320px]">
        <div class="flex justify-between py-2 text-[12px]">
          <span class="font-bold text-[#111827] text-right flex-1 pr-6">Sub Total</span>
          <span class="text-right w-32">${total}</span>
        </div>
        
        <div class="flex justify-between py-3 text-[12px] border-t border-b border-[#e5e7eb] my-2">
          <span class="font-bold text-[#111827] text-right flex-1 pr-6">
            ${type === "quote" ? "Estimated Total" : "Total"}
          </span>
          <span class="font-bold text-[#111827] text-right w-32">${total}</span>
        </div>
        
        ${
    isReceipt || type === "invoice"
      ? `
          <div class="flex justify-between py-2 text-[12px]">
            <span class="text-[#111827] text-right flex-1 pr-6">Payment Made</span>
            <span class="text-[#ef4444] text-right w-32">(-) ${
        ticket.status === "completed" ? total : "0.00"
      }</span>
          </div>
        `
      : ""
  }
        
        <div class="flex justify-between py-3 px-2 text-[12px] bg-[#f3f4f6] mt-2">
          <span class="font-bold text-[#111827] text-right flex-1 pr-4">
            ${type === "quote" ? "Estimated Balance" : "Balance Due"}
          </span>
          <span class="font-bold text-[#111827] text-right w-32">${balanceDue}</span>
        </div>
      </div>
    </div>
  `;

  return `
    <div class="bg-[#ffffff] text-[#111827] font-sans text-[13px] w-[750px] min-h-[1050px] p-10 mx-auto flex flex-col" style="box-sizing: border-box;">
      <!-- Header -->
      <div class="flex justify-between items-start mb-8">
        <div>
          <div class="mb-6">
             <img src="${logoUrl}" alt="Urban Device Care" class="h-16 object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
             <h1 class="text-2xl font-black tracking-tighter text-[#2563eb] hidden">URBAN DEVICE CARE</h1>
          </div>
          <div class="text-[12px] text-[#4b5563] leading-snug space-y-0.5">
            <p class="font-bold text-[#111827] text-[13px] mb-1">Urban Device Care Ltd</p>
            <p>Bekim house</p>
            <p>Westlands crossway Road</p>
            <p>Nairobi 00800</p>
            <p>Kenya</p>
            <p>0115682959</p>
            <p>7c8bczm6zk@privaterelay.appleid.com</p>
            <p>KRA PIN P052534849N</p>
          </div>
        </div>
        <div class="text-right flex flex-col items-end">
          <h2 class="text-[40px] font-normal text-black mb-1 tracking-wide uppercase">${title}</h2>
          <p class="text-[13px] font-bold text-[#374151] mb-8"># ${ticket.ticket_number}</p>
          
          <div class="text-[12px] text-[#4b5563] mb-0.5">${headerValueLabel}</div>
          <div class="text-base font-bold text-[#111827]">${headerValue}</div>
        </div>
      </div>

      <div class="mt-12 mb-6 flex justify-between items-end">
        <div class="pb-1">
          <p class="font-bold text-[#111827] text-[13px]">${customerName}</p>
          ${
    ticket.device?.brand
      ? `
            <div class="mt-2 text-[#4b5563] text-[11px] max-w-[200px]">
               <p><span class="font-semibold text-[#1f2937]">Device:</span> ${ticket.device.brand} ${
        ticket.device.model_name || ""
      }</p>
               <p><span class="font-semibold text-[#1f2937]">Serial:</span> ${
        ticket.device.serial_number || "N/A"
      }</p>
            </div>
          `
      : ""
  }
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-[12px] text-right w-64 pb-1">
          <div class="text-[#4b5563]">${
    type === "quote" ? "Estimate Date" : "Invoice Date"
  } :</div>
          <div class="text-[#111827]">${date}</div>
          
          <div class="text-[#4b5563]">Terms :</div>
          <div class="text-[#111827]">${termsText}</div>
          
          ${dueDateHtml}
        </div>
      </div>

      ${
    ticket.issue_description
      ? `
      <div class="mb-8">
         <h4 class="font-semibold text-[#111827] mb-2 text-[12px]">Reported Issue:</h4>
         <p class="text-[12px] text-[#374151] p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">${ticket.issue_description}</p>
      </div>
      `
      : ""
  }

      ${isJobCard ? jobCardDynamicHtml : financialDynamicHtml}

      <!-- Spacer to push footer to bottom -->
      <div class="flex-grow"></div>

      <!-- Footer / Notes -->
      <div class="text-[12px] text-[#4b5563] space-y-1 mt-auto">
        <p>${footerText}</p>
        <p>Paybill: 880100 - Acc No: PAYURBANDEVICE</p>
      </div>

      <!-- Bottom Border and Powered By -->
      <div class="border-t border-[#e5e7eb] mt-12 pt-4 pb-4 flex justify-between items-center text-[10px] text-[#9ca3af]">
        <div class="flex items-center gap-2">
          <span class="uppercase tracking-widest font-semibold text-[#6b7280]">POWERED BY</span>
          <div class="flex gap-[3px] opacity-80 pt-[2px]">
             <div class="w-2 h-2 bg-[#ef4444] rounded-[2px]"></div>
             <div class="w-2 h-2 bg-[#eab308] rounded-[2px]"></div>
             <div class="w-2 h-2 bg-[#22c55e] rounded-[2px]"></div>
             <div class="w-2 h-2 bg-[#3b82f6] rounded-[2px]"></div>
          </div>
        </div>
        <span>1</span>
      </div>
    </div>
  `;
}
