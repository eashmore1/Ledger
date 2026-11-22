// ═══════════════════════════════════════════════
// QUESTION BANK
// ═══════════════════════════════════════════════
const QB_SECTIONS = [
  {code:'FAR',full:'Financial Accounting & Reporting',color:'#dc2626',mcqTotal:595},
  {code:'AUD',full:'Auditing & Attestation',color:'#2563eb',mcqTotal:597},
  {code:'REG',full:'Regulation',color:'#059669',mcqTotal:600},
  {code:'TCP',full:'Tax Compliance & Planning',color:'#0d9488',mcqTotal:695},
  {code:'BAR',full:'Business Analysis & Reporting',color:'#d97706',mcqTotal:696},
  {code:'ISC',full:'Information Systems & Controls',color:'#9333ea',mcqTotal:752},
];
QB_SECTIONS.forEach(x=>Object.defineProperty(x,'color',{get:()=>_sectionColor(x.code),enumerable:true,configurable:true}));

// ── Question data per section ──
const QB_QUESTIONS = {
  FAR: [
    {q:'Under GASB, governmental funds use which basis of accounting?',choices:['Full accrual','Modified accrual','Cash basis','Tax basis'],correct:1,exp:'Governmental funds use modified accrual. Revenue is recognized when available and measurable; expenditures when the liability is incurred.'},
    {q:'A company uses FIFO. Ending inventory is $500,000; under LIFO it would be $430,000. The LIFO reserve is:',choices:['$70,000','$500,000','$430,000','$930,000'],correct:0,exp:'LIFO Reserve = FIFO Inventory \u2013 LIFO Inventory = $500,000 \u2013 $430,000 = $70,000.'},
    {q:'Under ASC 842, a lessee records an operating lease as:',choices:['Off-balance-sheet','Right-of-use asset + lease liability','Lease liability only','Right-of-use asset only'],correct:1,exp:'ASC 842 requires lessees to recognize a ROU asset and corresponding lease liability for virtually all leases.'},
    {q:'Which fund accounts for water utility operations?',choices:['General Fund','Special Revenue Fund','Enterprise Fund','Agency Fund'],correct:2,exp:'Enterprise funds (proprietary) account for business-like activities such as utilities.'},
    {q:'When a specific account is written off under the allowance method, net realizable value:',choices:['Decreases','Increases','Is unchanged','Depends on amount'],correct:2,exp:'Both gross AR and the allowance decrease by the same amount, so NRV is unchanged.'},
    {q:'A $1,000,000 8% bond issued at 105 creates a premium of:',choices:['$50,000','$80,000','$105,000','$45,000'],correct:0,exp:'Premium = $1,050,000 \u2013 $1,000,000 = $50,000.'},
    {q:'Under ASC 606, revenue is recognized:',choices:['When cash is received','When invoice is issued','When performance obligations are satisfied','At contract inception'],correct:2,exp:'Revenue is recognized when (or as) performance obligations are satisfied per ASC 606.'},
    {q:'The indirect method for operating cash flows starts with:',choices:['Revenue','Gross profit','Net income','Operating income'],correct:2,exp:'The indirect method starts with net income and adjusts for non-cash items and changes in working capital.'},
    {q:'An intangible asset with an indefinite life is:',choices:['Amortized over 40 years','Tested for impairment annually, not amortized','Expensed immediately','Amortized over 10 years'],correct:1,exp:'Indefinite-lived intangibles are not amortized; they are tested for impairment at least annually.'},
    {q:'A contingent liability is accrued when a loss is:',choices:['Possible and estimable','Probable and reasonably estimable','Remote and estimable','Probable only'],correct:1,exp:'Per ASC 450, a contingent loss is accrued when it is probable and the amount can be reasonably estimated.'},
    {q:'Under the equity method, an investor owns 25% of an investee earning $100,000. Investor records:',choices:['$0','$25,000 income','$100,000 income','$25,000 dividend income'],correct:1,exp:'Under the equity method, the investor recognizes its proportionate share of the investee\'s net income.'},
    {q:'Goodwill is recognized in a business combination as:',choices:['Cost over book value of net assets','FMV of acquired assets','Purchase price minus liabilities assumed','Excess of purchase price over FMV of net identifiable assets'],correct:3,exp:'Goodwill = Purchase price \u2013 Fair value of net identifiable assets acquired.'},
    {q:'A temporary difference creating a deferred tax liability occurs when:',choices:['Book income > Tax income in current period','Tax income > Book income','Tax expense > Book expense','No timing difference exists'],correct:0,exp:'When book income exceeds taxable income, more taxes will be owed in the future, creating a DTL.'},
    {q:'Treasury stock is recorded at:',choices:['Par value','Fair value at repurchase','Cost','Book value per share'],correct:2,exp:'Treasury stock is typically recorded at cost under the cost method.'},
    {q:'A $200,000 machine with 10-year life, $20,000 salvage \u2014 DDB depreciation Year 1 is:',choices:['$18,000','$36,000','$40,000','$20,000'],correct:2,exp:'DDB rate = 2/10 = 20%. Year 1 = $200,000 \u00d7 20% = $40,000 (salvage ignored until book value nears it).'},
    {q:'Under IFRS, qualifying development costs are:',choices:['Always expensed','Capitalized as intangible when criteria met','Amortized over 40 years','Written off in period incurred'],correct:1,exp:'IAS 38 requires capitalization of development costs when specific feasibility and intent criteria are demonstrated.'},
    {q:'Which is NOT a component of stockholders\' equity?',choices:['Common stock','APIC','Retained earnings','Accounts payable'],correct:3,exp:'Accounts payable is a liability, not equity.'},
    {q:'Under the percentage-of-completion method, revenue is recognized:',choices:['At project completion','Based on costs incurred relative to total expected costs','When cash is received','Equally each period'],correct:1,exp:'Percentage-of-completion recognizes revenue proportional to work completed, typically measured by cost incurred to date / total estimated cost.'},
    {q:'Service cost component of net periodic pension cost is classified as:',choices:['OCI','Operating expense','Financing activity','Non-operating income'],correct:1,exp:'Service cost \u2014 the PV of benefits earned by employees this period \u2014 is an operating expense.'},
    {q:'Comprehensive income equals:',choices:['Net income only','Net income + OCI','Operating income','Gross profit'],correct:1,exp:'Comprehensive income = Net income + Other Comprehensive Income (OCI), which includes items like unrealized AFS gains and pension adjustments.'},
    {q:'Under ASC 810, a variable interest entity (VIE) is consolidated by:',choices:['The entity with the most equity','The primary beneficiary who absorbs majority of risk/reward','The entity that created it','No consolidation required'],correct:1,exp:'The primary beneficiary \u2014 who absorbs the majority of expected losses or residual returns \u2014 must consolidate a VIE.'},
    {q:'A bond discount is amortized using the effective interest method. This means interest expense is:',choices:['Constant each period','Calculated as carrying value \u00d7 market rate','Equal to the coupon payment','Lower than cash paid'],correct:1,exp:'Under the effective interest method, interest expense = carrying value \u00d7 market (effective) interest rate at issuance.'},
    {q:'Which statement is true about IFRS vs. US GAAP inventory?',choices:['IFRS permits LIFO','US GAAP requires FIFO','IFRS prohibits LIFO; US GAAP allows LIFO, FIFO, or weighted avg','Both require FIFO'],correct:2,exp:'IFRS prohibits LIFO. US GAAP allows LIFO, FIFO, and weighted average, but requires LIFO conformity for tax purposes.'},
    {q:'Under ASC 958, a nonprofit organization reports net assets in how many classes?',choices:['One','Two (with and without donor restrictions)','Three','Four'],correct:1,exp:'ASU 2016-14 simplified nonprofit net asset classifications to two: with donor restrictions and without donor restrictions.'},
    {q:'The direct method for operating cash flows shows:',choices:['Net income adjusted for non-cash items','Actual cash receipts and payments from operations','Only investing activities','Capital expenditures less depreciation'],correct:1,exp:'The direct method presents major classes of gross cash receipts and payments from operating activities directly.'},
    {q:'An investment in debt securities classified as "held-to-maturity" is reported at:',choices:['Fair value with unrealized gains/losses in OCI','Amortized cost','Fair value through net income','Lower of cost or market'],correct:1,exp:'HTM debt securities are reported at amortized cost; the entity has intent and ability to hold them to maturity.'},
    {q:'Which type of lease is recorded by the lessee similarly to a purchased asset?',choices:['Operating lease','Finance lease','Short-term lease','Month-to-month lease'],correct:1,exp:'Finance leases (formerly capital leases) result in the lessee recognizing an ROU asset that is depreciated and an interest-bearing liability, similar to owning the asset.'},
    {q:'Under GASB, which fund type uses full accrual accounting?',choices:['General fund','Special revenue fund','Enterprise fund (proprietary)','Debt service fund'],correct:2,exp:'Proprietary funds (enterprise and internal service) use full accrual accounting, like commercial entities.'},
    {q:'A company issues convertible bonds. Under US GAAP (pre-ASU 2020-06), the conversion feature was recorded as:',choices:['Entirely as debt','Partly as debt, partly as equity (APIC)','Entirely as equity','As a derivative liability'],correct:1,exp:'Pre-ASU 2020-06, US GAAP required bifurcation: the debt component was discounted and the equity (conversion option) was recorded in APIC.'},
    {q:'R&D costs under US GAAP are:',choices:['Capitalized and amortized over product life','Expensed as incurred','Capitalized only if technological feasibility established','Deferred until revenue is earned'],correct:1,exp:'Under ASC 730, R&D costs are generally expensed as incurred under US GAAP (unlike IFRS which capitalizes qualifying development costs).'},
    {q:'Under ASC 230, which of the following is classified as an investing activity?',choices:['Payment of dividends','Proceeds from issuing bonds','Purchase of equipment','Repayment of long-term debt'],correct:2,exp:'Purchases and sales of long-term assets (property, plant, equipment, investments) are investing activities under ASC 230.'},
    {q:'A company factors $500,000 of receivables with recourse. The factor charges a 3% fee. Under ASC 860, this is treated as a sale if:',choices:['The company retains all credit risk','Control is surrendered and the transfer qualifies as a sale','The factor has no right to return receivables','The fee is under 5%'],correct:1,exp:'Under ASC 860, a transfer is a sale if control is surrendered — the transferor has no obligation to repurchase and the transferee has the right to pledge or sell the assets.'},
    {q:'Under the lower of cost or net realizable value (LCNRV) rule for inventory, NRV is defined as:',choices:['Replacement cost','Estimated selling price less cost to complete and sell','Fair value','Market value per quoted price'],correct:1,exp:'NRV = estimated selling price in the ordinary course of business minus reasonably predictable completion and selling costs (ASC 330).'},
    {q:'Which type of governmental fund accounts for resources legally restricted for debt principal and interest payments?',choices:['General Fund','Capital Projects Fund','Debt Service Fund','Permanent Fund'],correct:2,exp:'Debt Service Funds account for the accumulation of resources for, and payment of, general long-term debt principal and interest.'},
    {q:'A sale-leaseback transaction where the seller-lessee retains control results in:',choices:['Full gain recognized immediately','Gain deferred and recognized over the lease term proportionally','No gain ever recognized','Gain recognized only when lease expires'],correct:1,exp:'Under ASC 842, if the transfer qualifies as a sale, the seller-lessee recognizes a right-of-use asset and lease liability, and defers the gain, recognizing it over the lease term.'},
    {q:'The fair value option under ASC 825 allows entities to:',choices:['Use fair value only for investments','Elect fair value measurement for eligible financial instruments with changes in net income','Elect fair value for all assets and liabilities','Apply fair value measurement only at acquisition'],correct:1,exp:'ASC 825 permits entities to irrevocably elect fair value for eligible financial instruments, with subsequent changes recognized in net income.'},
    {q:'Under GASB 34, government-wide financial statements use:',choices:['Modified accrual basis','Cash basis','Full accrual basis and economic resources focus','Budget basis'],correct:2,exp:'GASB 34 government-wide statements (Statement of Net Position and Statement of Activities) use the full accrual basis and economic resources measurement focus.'},
    {q:'Stock dividends are recorded at:',choices:['Par value of shares issued','Fair market value of shares issued','Cost of shares reissued','No entry required'],correct:0,exp:'Stock dividends are recorded at par value (for large stock dividends >20-25%) or fair value (for small stock dividends). The most common CPA exam answer for a large stock dividend is par value.'},
    {q:'The component depreciation approach under IFRS (IAS 16) requires:',choices:['Single depreciation rate for entire asset','Depreciating significant components separately over their individual useful lives','Straight-line only','Units of production for all assets'],correct:1,exp:'IAS 16 requires that each significant component of an asset with a different useful life be depreciated separately. US GAAP does not require this.'},
    {q:'Impairment of a long-lived asset held for use is tested using:',choices:['Discounted future cash flows only','Two-step test: recoverability (undiscounted) then measurement (discounted)','Fair value less selling costs','Replacement cost'],correct:1,exp:'ASC 360: Step 1 — compare undiscounted future cash flows to carrying value (recoverability). If impaired, Step 2 measures impairment as carrying value minus fair value.'},
    {q:'Which of the following would increase operating cash flow under the indirect method?',choices:['Increase in accounts receivable','Decrease in accounts payable','Decrease in inventory','Increase in prepaid expenses'],correct:2,exp:'A decrease in inventory is a source of cash (an asset decreased), which increases operating cash flow in the indirect method.'},
    {q:'Under ASC 805, contingent consideration in a business combination is:',choices:['Recorded only when the contingency is resolved','Recognized at fair value on the acquisition date','Excluded from purchase price allocation','Recorded as a liability only if probable'],correct:1,exp:'ASC 805 requires contingent consideration to be measured at fair value on the acquisition date and included in the purchase price.'},
    {q:'A bond with a face rate below the market rate will sell at:',choices:['A premium','Par','A discount','Face value plus accrued interest only'],correct:2,exp:'When the stated (coupon) rate is below the market rate, investors pay less than face value to compensate — the bond sells at a discount.'},
    {q:'The translation method (ASC 830) for a foreign subsidiary using a functional currency different from the parent uses:',choices:['Current rate for all assets/liabilities; historical rate for equity','Temporal method','All-current method; translation adjustments go to OCI','All-historical rates'],correct:2,exp:'The current rate (all-current) method translates assets and liabilities at the current rate; equity at historical rates; translation adjustments go to Other Comprehensive Income.'},
    {q:'Diluted EPS includes the effect of:',choices:['Only actual shares outstanding','All potential dilutive securities (options, warrants, convertibles) if they decrease EPS','Antidilutive securities','Treasury shares held by subsidiaries'],correct:1,exp:'Diluted EPS includes the impact of all potentially dilutive securities — but only if they reduce EPS (antidilutive securities are excluded).'},
    {q:'Under IFRS 16, a lessee is required to recognize:',choices:['All leases off-balance-sheet','A right-of-use asset and lease liability for virtually all leases (with limited exemptions)','Only finance leases on-balance-sheet','Lease expense on a straight-line basis with no balance sheet impact'],correct:1,exp:'IFRS 16 eliminated the operating lease off-balance-sheet treatment for lessees. Nearly all leases result in a ROU asset and liability (exemptions for short-term and low-value leases).'},
    {q:'Convertible preferred stock is included in diluted EPS using the:',choices:['Treasury stock method','If-converted method','Reverse treasury stock method','Earnings yield method'],correct:1,exp:'Convertible preferred stock and convertible bonds use the if-converted method: add back the after-tax preferred dividend/interest, add shares assumed converted to compute diluted EPS.'},
    {q:'A nonprofit receives a $1M donation restricted for construction of a new building. It should be reported as:',choices:['Revenue without donor restrictions','Revenue with donor restrictions','Contributed capital','Deferred revenue'],correct:1,exp:'Donor-restricted contributions (purpose or time restrictions) are classified as net assets with donor restrictions until restrictions are met (ASC 958).'},
    {q:'Under ASC 350, which of the following is NOT amortized?',choices:['Customer list purchased in a business combination','Patent acquired externally','Goodwill','Software development costs post-technological feasibility'],correct:2,exp:'Goodwill is not amortized under US GAAP (it is tested for impairment annually). Other finite-lived intangibles are amortized over their useful lives.'},
    {q:'The modified accrual basis recognizes revenue when it is:',choices:['Earned, regardless of collection timing','Available (collectible within 60 days) and measurable','Collected in cash','Invoiced to the taxpayer or customer'],correct:1,exp:'Under modified accrual, revenue is recognized when it is both measurable (determinable) and available (expected to be collected within the current period or soon enough thereafter, typically 60 days).'},
    {q:'A change in accounting estimate is recorded:',choices:['Retroactively with prior period restatement','Prospectively — current and future periods','As a prior period adjustment to retained earnings','Only disclosed, no entry required'],correct:1,exp:'Changes in accounting estimate (e.g., useful life, allowance) are applied prospectively — no restatement of prior periods required.'},
    {q:'Which is NOT a required disclosure under ASC 280 (segment reporting)?',choices:['Segment revenue','Segment profit or loss','Segment CEO compensation','Segment assets'],correct:2,exp:'ASC 280 requires revenue, profit/loss, and assets for each reportable segment. Individual executive compensation by segment is not a required disclosure.'},
    {q:'Interest costs during self-construction of a qualifying asset are:',choices:['Expensed as incurred','Capitalized to the cost of the asset during the construction period','Capitalized indefinitely','Disclosed only, not capitalized'],correct:1,exp:'ASC 835-20 requires capitalization of actual interest costs incurred during the period an asset is being prepared for its intended use.'},
    {q:'The statement of cash flows is required under:',choices:['GASB only','US GAAP and IFRS for all entities','For public companies only','Only when creditors request it'],correct:1,exp:'Both US GAAP (ASC 230) and IFRS (IAS 7) require a statement of cash flows as a primary financial statement.'},
    {q:'A subsequent event that provides evidence of a condition that existed at the balance sheet date requires:',choices:['Disclosure only','Adjustment to the financial statements','No action','Management discussion only'],correct:1,exp:'Type I (recognized) subsequent events provide additional evidence about conditions existing at the balance sheet date and require adjustment to the financial statements.'},
    {q:'Under ASC 310, a loan is considered impaired when:',choices:['The interest rate changes','It is probable that all principal and interest will not be collected per contractual terms','The borrower requests a modification','It is 30 days past due'],correct:1,exp:'ASC 310-10: a loan is impaired when it is probable, based on current information, that the creditor will be unable to collect all amounts due per contractual terms.'},
    {q:'The effective interest rate method for bond amortization produces:',choices:['Equal interest expense each period','Interest expense that grows if bonds were issued at a discount','Constant cash payments but no amortization','Interest expense equal to the coupon each period'],correct:1,exp:'Under the effective interest method, interest expense = carrying value × market rate. For discount bonds, carrying value increases each period, causing interest expense to grow over time.'},
    {q:'Under GASB, which statement is true about Infrastructure assets in government-wide reporting?',choices:['They are expensed when purchased','They are reported as capital assets and may use the modified approach (no depreciation if maintained)','They are always depreciated over 20 years','They are reported only in fund financial statements'],correct:1,exp:'GASB 34 allows governments to use the modified approach for infrastructure: no depreciation is required if the government documents that the assets are being maintained at or above a condition level.'},
    {q:'A company has a defined benefit pension plan. The projected benefit obligation (PBO) exceeds plan assets. This unfunded status is reported:',choices:['Off-balance-sheet only in footnotes','As a liability on the balance sheet under ASC 715','As OCI only','As a reduction in equity directly'],correct:1,exp:'ASC 715 requires recognition of the funded status of a pension plan on the balance sheet — an underfunded PBO is reported as a non-current liability.'},
    {q:'Under the retail inventory method, the cost-to-retail ratio is used to:',choices:['Calculate LIFO reserve','Convert ending inventory at retail prices to an estimated cost','Determine selling price markups','Compute gross profit percentage'],correct:1,exp:'The retail inventory method estimates ending inventory cost by multiplying ending inventory at retail by the cost-to-retail ratio (cost of goods available / retail value of goods available).'},
  ],
  AUD: [
    {q:'The primary objective of an audit is to:',choices:['Detect all misstatements','Guarantee financial statement accuracy','Obtain reasonable assurance FS are free of material misstatement','Prevent all fraud'],correct:2,exp:'The auditor obtains reasonable assurance \u2014 high but not absolute \u2014 that FS are free from material misstatement.'},
    {q:'Inherent risk is best described as:',choices:['Risk of audit team error','Susceptibility to misstatement assuming no controls','Risk that controls fail to prevent misstatement','Risk of undetected misstatements in testing'],correct:1,exp:'Inherent risk is the susceptibility of an assertion to material misstatement before considering any related controls.'},
    {q:'A disclaimer of opinion is issued when:',choices:['Going concern uncertainty exists','Scope limitation prevents sufficient evidence','Material misstatement found','Client changes accounting principle'],correct:1,exp:'A disclaimer is appropriate when the auditor cannot obtain sufficient appropriate audit evidence.'},
    {q:'Which is NOT an analytical procedure?',choices:['Ratio analysis','Trend analysis','Regression analysis','Vouching source documents'],correct:3,exp:'Vouching is a substantive test of details, not an analytical procedure.'},
    {q:'Professional skepticism means the auditor:',choices:['Assumes management is dishonest','Applies critical questioning without bias toward honesty or dishonesty','Assumes information is accurate until disproven','Considers all management statements unreliable'],correct:1,exp:'Professional skepticism is a questioning mind and critical assessment, not assuming honesty or dishonesty.'},
    {q:'Control risk is the risk that:',choices:['Internal controls fail to prevent/detect material misstatement on a timely basis','Auditor selects the wrong test','Management overrides all controls','Employees commit fraud undetected'],correct:0,exp:'Control risk: material misstatements will not be prevented or detected on a timely basis by internal controls.'},
    {q:'A material weakness is defined as a deficiency where there is a:',choices:['Any single control failure','Reasonable possibility that material misstatement won\'t be prevented/detected on a timely basis','Certainty of a misstatement','Minor control gap with no financial impact'],correct:1,exp:'Material weakness = reasonable possibility that a material misstatement won\'t be prevented or detected and corrected on a timely basis.'},
    {q:'The most reliable form of audit evidence is:',choices:['Oral management representations','Internal documents reviewed internally','External documents received directly by the auditor','Internally generated unreviewed documents'],correct:2,exp:'Evidence received directly from external parties (e.g., bank confirmations sent to auditor) is most reliable.'},
    {q:'The engagement letter primarily serves to:',choices:['Satisfy SEC disclosure requirements','Establish engagement terms and reduce misunderstanding','Replace the management representation letter','Document the client\'s internal controls'],correct:1,exp:'The engagement letter documents agreed-upon terms to reduce misunderstandings between auditor and client.'},
    {q:'Sampling risk in auditing refers to:',choices:['Risk of selecting a non-representative sample by chance','Possibility the sample conclusion differs from what full-population testing would show','Risk that the sample size is too small','Both A and C'],correct:1,exp:'Sampling risk: the auditor\'s conclusion based on the sample may differ from what the entire population would indicate.'},
    {q:'An integrated audit under PCAOB includes:',choices:['Financial statements only','Internal control over financial reporting only','Both financial statements and ICFR','Management discussion and analysis'],correct:2,exp:'An integrated audit (SOX Section 404(b)) covers both the financial statements and ICFR.'},
    {q:'An unmodified (clean) opinion means:',choices:['No issues were found','Financial statements present fairly in all material respects','Scope was fully unrestricted','No related-party transactions exist'],correct:1,exp:'An unmodified opinion states that FS present fairly in all material respects in conformity with GAAP.'},
    {q:'Audit documentation must be retained for at least:',choices:['3 years','5 years','7 years','10 years'],correct:2,exp:'Under PCAOB and AICPA standards, audit documentation must generally be retained for 7 years.'},
    {q:'A Type II subsequent event requires:',choices:['Adjustment to financial statements','Disclosure only in the notes','No action required','Reissuance of the audit report'],correct:1,exp:'Type II (non-recognized) subsequent events do not provide evidence of conditions at the balance sheet date \u2014 only note disclosure is required.'},
    {q:'Which procedure provides the highest level of assurance?',choices:['Inquiry of management','Analytical procedures','Inspection of external documents','Observation of physical inventory'],correct:2,exp:'Inspection of externally generated documents provides stronger evidence than inquiry or analytical procedures.'},
    {q:'A significant deficiency in ICFR is:',choices:['Less severe than a material weakness but still important enough to merit attention of those charged with governance','More severe than a material weakness','Any minor control gap','A deficiency with no financial impact'],correct:0,exp:'A significant deficiency warrants the attention of those charged with governance but is less severe than a material weakness.'},
    {q:'When assessing going concern, the auditor looks forward:',choices:['3 months from FS date','6 months from FS date','12 months from FS issuance date','24 months from FS date'],correct:2,exp:'Auditors assess substantial doubt about an entity\'s ability to continue for 12 months from the FS issuance date.'},
    {q:'Statistical sampling allows the auditor to:',choices:['Eliminate sampling risk','Quantify and control sampling risk','Remove the need for professional judgment','Test 100% of a population efficiently'],correct:1,exp:'Statistical sampling allows the auditor to quantify (measure) and control sampling risk; non-statistical sampling does not.'},
    {q:'The purpose of a management representation letter is to:',choices:['Substitute for audit evidence obtained','Confirm management\'s responsibilities and representations about the FS','Replace the engagement letter','Document the audit strategy'],correct:1,exp:'The management rep letter confirms that management has provided complete information and acknowledges its responsibilities.'},
    {q:'Independence standards generally prohibit the auditor from having:',choices:['Any business discussions with the client','A direct or material indirect financial interest in the audit client','Non-audit service discussions','Any client referrals or social interactions'],correct:1,exp:'Independence rules prohibit financial interests in audit clients that could impair objectivity and the appearance of independence.'},
    {q:'Which opinion is appropriate when the FS contain a material and pervasive misstatement?',choices:['Unmodified','Qualified','Adverse','Disclaimer'],correct:2,exp:'An adverse opinion is issued when FS are materially and pervasively misstated \u2014 they do not present fairly.'},
    {q:'Audit risk = inherent risk \u00d7 control risk \u00d7 detection risk. If IR and CR are both high, detection risk should be set:',choices:['High','Moderate','Low','Zero'],correct:2,exp:'Audit risk is the product of IR \u00d7 CR \u00d7 DR. If IR and CR are both high, the auditor must set DR low (perform more/better tests) to keep overall audit risk at an acceptable level.'},
    {q:'The concept of materiality is BEST described as:',choices:['Any amount over $10,000','An amount that would influence the decision of a reasonable user of the financial statements','Amounts exceeding 5% of net income','All errors regardless of size'],correct:1,exp:'Materiality is a matter of professional judgment \u2014 it is the threshold above which a misstatement would influence the economic decisions of reasonable users.'},
    {q:'In a review engagement, the accountant provides:',choices:['Reasonable assurance','Limited (negative) assurance','Absolute assurance','No assurance'],correct:1,exp:'A review provides limited (negative) assurance: "nothing came to our attention" \u2014 less than the reasonable assurance of an audit.'},
    {q:'The auditor\'s report on ICFR under AS 2201 should be issued as of:',choices:['The end of the most recent fiscal year','The date of auditor\'s report on FS','The beginning of the fiscal year','The date management assessed ICFR'],correct:0,exp:'The auditor\'s ICFR opinion is as of the end of the most recent fiscal year, coinciding with the FS balance sheet date.'},
    {q:'Fraud risk factors related to misappropriation of assets typically include:',choices:['Complex related-party transactions','Large cash balances with weak controls over custody','Aggressive revenue recognition','Management override of revenue controls'],correct:1,exp:'Misappropriation of assets is most common when there are valuable, liquid assets (cash, inventory) with weak custody and accountability controls.'},
    {q:'Which of the following is an example of a substantive test?',choices:['Reviewing the entity\'s org chart','Walkthrough of a control','Confirmation of accounts receivable balances','Evaluating control design effectiveness'],correct:2,exp:'Confirmations are substantive procedures \u2014 they directly test account balances and transaction amounts for accuracy.'},
    {q:'A CPA firm\'s quality control policies should address:',choices:['Only independence requirements','Human resources, engagement performance, and monitoring, among other elements','Client billing practices only','Audit fees and staffing'],correct:1,exp:'Quality control per SQCS No. 8 addresses: leadership responsibilities, ethical requirements, acceptance/continuance, human resources, engagement performance, and monitoring.'},
    {q:'When the auditor identifies a related-party transaction, the primary concern is:',choices:['Whether the transaction is legal','Whether proper disclosure has been made and terms are at arm\'s length','Transaction size only','Whether all parties are profitable'],correct:1,exp:'Related-party transactions require disclosure under ASC 850. The auditor focuses on whether terms are disclosed and whether the transaction was conducted at arm\'s length.'},
    {q:'Under SAS No. 99, the auditor should specifically address fraud risk by:',choices:['Assuming management is trustworthy','Brainstorming with the engagement team about how fraud might occur','Relying solely on analytical procedures','Testing only high-value transactions'],correct:1,exp:'SAS 99 requires an engagement team discussion (brainstorming) about how and where fraud might occur, regardless of prior experience with the client.'},
    {q:'The auditor\'s primary responsibility regarding fraud is to:',choices:['Investigate and prosecute fraud','Obtain reasonable assurance that FS are free of material misstatement due to fraud or error','Prevent fraud through control recommendations','Report all suspected fraud to law enforcement'],correct:1,exp:'The auditor\'s responsibility is to obtain reasonable assurance — detecting all fraud is not guaranteed, but the audit must be designed to detect material fraud.'},
    {q:'Which of the following is an example of a test of controls?',choices:['Confirming accounts receivable with customers','Tracing a sample of transactions through the payroll system to verify approvals occurred','Recalculating depreciation expense','Reviewing board of directors meeting minutes for large transactions'],correct:1,exp:'Tests of controls evaluate whether controls are operating effectively (e.g., verifying that approval procedures were followed), not the dollar amounts themselves.'},
    {q:'Under AU-C 315, the risk of material misstatement is assessed at which levels?',choices:['Transaction level only','Financial statement level and assertion level','Account balance level only','Engagement level and report level'],correct:1,exp:'RMM is assessed at both the overall financial statement level (pervasive risks) and the assertion level for each significant account and disclosure.'},
    {q:'When an auditor uses negative confirmation requests, this approach is MOST appropriate when:',choices:['Control risk is high','The audited population consists of a large number of small, homogeneous accounts with low error rates','The client is new and untested','Many recipients are expected not to respond'],correct:1,exp:'Negative confirmations are appropriate when there are many small accounts, control risk is low, and there is no reason to believe recipients will not respond.'},
    {q:'The concept of "audit risk" means the auditor may:',choices:['Fail to finish the audit on time','Unknowingly issue an inappropriate opinion on materially misstated financial statements','Charge too much in fees','Miss a minor rounding error'],correct:1,exp:'Audit risk is the risk that the auditor expresses an inappropriate opinion — typically an unmodified opinion — when the financial statements are materially misstated.'},
    {q:'Which of the following conditions is NOT one of the fraud risk factors in the "fraud triangle"?',choices:['Incentive/pressure','Opportunity','Rationalization','Collusion'],correct:3,exp:'The fraud triangle consists of Incentive/Pressure, Opportunity, and Rationalization. Collusion is a condition that can overcome segregation of duties but is not itself one of the three triangle elements.'},
    {q:'An auditor issues a qualified opinion using the phrase "except for." This means:',choices:['The FS are free of all misstatements','A specific matter is misstated or a scope limitation exists, but the issue is not pervasive','The FS contain pervasive misstatements','The auditor is disclaiming an opinion'],correct:1,exp:'A qualified opinion is appropriate when a misstatement or scope limitation is material but NOT pervasive — the issue is contained and the rest of the FS are fairly presented.'},
    {q:'The "expectation gap" in auditing refers to:',choices:['The gap between budgeted and actual audit hours','The difference between what users expect auditors to do vs. what auditors are actually responsible for','The difference between inherent and detection risk','Time gap between audit fieldwork and report issuance'],correct:1,exp:'The expectation gap is the difference between public expectations (e.g., detecting all fraud, guaranteeing accuracy) and what audits actually provide (reasonable assurance of no material misstatement).'},
    {q:'Completeness is an assertion that addresses whether:',choices:['Recorded transactions actually occurred','All transactions and events that should be recorded have been included','Assets, liabilities exist at the balance sheet date','Amounts are correctly classified'],correct:1,exp:'Completeness asserts that all transactions that should be recorded are recorded — it guards against omissions rather than fictitious additions.'},
    {q:'When evaluating internal controls over financial reporting, an auditor performs walkthroughs to:',choices:['Verify final account balances','Trace one or more transactions from initiation to recording to understand and confirm control design','Test 100% of transactions in a cycle','Determine materiality thresholds'],correct:1,exp:'Walkthroughs (tracing transactions end-to-end) confirm the auditor understands the flow of transactions and help evaluate whether controls are designed properly.'},
    {q:'Which type of audit opinion is issued when the auditor is unable to obtain sufficient appropriate evidence and the potential effect is material and pervasive?',choices:['Qualified opinion','Adverse opinion','Disclaimer of opinion','Emphasis-of-matter paragraph'],correct:2,exp:'When a scope limitation is both material AND pervasive, the auditor cannot form an opinion and must disclaim — no opinion is issued.'},
    {q:'An emphasis-of-matter paragraph in an auditor\'s report:',choices:['Modifies the opinion','Draws users\' attention to a matter appropriately disclosed in the FS without modifying the opinion','Indicates a scope limitation','Always results in a qualified opinion'],correct:1,exp:'An emphasis-of-matter paragraph highlights important information already disclosed in the FS (e.g., going concern, change in accounting principle) but does not change the opinion.'},
    {q:'The purpose of the PCAOB is to:',choices:['Set accounting standards for public companies','Oversee auditors of public companies and set auditing standards for those engagements','Manage the CPA licensure process','Issue tax guidance for public entities'],correct:1,exp:'The PCAOB (created by SOX Section 101) registers, inspects, and disciplines accounting firms that audit public companies and issues auditing standards for those engagements.'},
    {q:'Lapping is a type of fraud that involves:',choices:['Inflating inventory counts','Concealing cash theft by applying a later receipt to an earlier customer\'s account','Falsifying vendor invoices','Recording fictitious sales'],correct:1,exp:'Lapping (a form of misappropriation) involves stealing cash from Customer A\'s payment, then covering it with Customer B\'s payment, then Customer C\'s, etc. — it requires access to both cash and AR records.'},
    {q:'Under PCAOB AS 2101, the auditor must assess and document the risks of material misstatement at:',choices:['The financial statement level only','Both the financial statement level and the assertion level for significant accounts','Only accounts exceeding 5% of total assets','The segment level'],correct:1,exp:'AS 2101 requires identifying and assessing RMM at the financial statement level and for each significant account/disclosure at the assertion level.'},
    {q:'Which of the following best describes "dual-purpose testing"?',choices:['Testing two separate audit objectives with separate procedures','Using a single procedure to simultaneously test a control and gather substantive evidence','Auditing both the parent and subsidiary','Testing opening and closing balances together'],correct:1,exp:'Dual-purpose tests accomplish two objectives with one procedure — e.g., testing whether a purchase order was approved (control) while also examining the amount (substantive).'},
    {q:'When a client uses a service organization, the auditor should:',choices:['Ignore the service organization\'s controls','Obtain understanding of controls at the service organization relevant to the audit, using a SOC report if available','Always perform a direct audit of the service organization','Disclaim an opinion automatically'],correct:1,exp:'Per AU-C 402, when a client\'s processing is done by a service organization, the auditor must understand those controls — a SOC 1 Type 2 report can provide this evidence.'},
    {q:'Audit documentation (workpapers) belong to:',choices:['The client','The auditing firm','The PCAOB','Jointly to firm and client'],correct:1,exp:'Audit workpapers are the property of the auditing firm, not the client, although the firm must maintain confidentiality.'},
    {q:'Which of the following is an example of a "key audit matter" (KAM) in PCAOB/IAASB standards?',choices:['Minor rounding differences','Going concern, complex fair value estimates, or significant accounting judgments that required significant auditor attention','All items mentioned in the engagement letter','Non-material disclosure omissions'],correct:1,exp:'Key audit matters (or critical audit matters under PCAOB) are areas of significant auditor judgment or risk during the audit — reported in the audit report for public companies.'},
    {q:'To reduce detection risk, an auditor should:',choices:['Reduce the sample size','Perform more or better-quality substantive procedures','Increase the reliance on internal controls','Reduce the scope of the audit'],correct:1,exp:'Detection risk is the risk that audit procedures fail to detect a material misstatement. To lower DR, the auditor increases the extent, timing, or quality of substantive tests.'},
    {q:'Which of the following is the PRIMARY purpose of auditing standards?',choices:['To set accounting treatment for complex transactions','To establish requirements for auditor conduct and quality of audit work','To determine audit fees','To replace ethical standards for CPAs'],correct:1,exp:'Auditing standards (AICPA SASs, PCAOB Standards) define the minimum requirements for audit quality, evidence gathering, reporting, and professional responsibilities.'},
    {q:'An auditor discovers a material misstatement that management refuses to correct. The auditor should issue:',choices:['An unmodified opinion with emphasis paragraph','A qualified or adverse opinion depending on pervasiveness','A disclaimer of opinion','A limited assurance report'],correct:1,exp:'If management refuses to correct a material misstatement, the auditor issues a qualified opinion (if isolated/not pervasive) or adverse opinion (if pervasive) — not a disclaimer.'},
    {q:'When using stratified sampling, the auditor:',choices:['Tests the entire population randomly','Divides the population into subgroups and samples each separately, allowing more focus on high-risk items','Tests only items above a dollar threshold','Uses judgment to select every other item'],correct:1,exp:'Stratification groups population items (e.g., by dollar amount) so that higher-value/risk items can be sampled more intensively, improving audit efficiency.'},
    {q:'Under the AICPA Code of Professional Conduct, a CPA may NOT disclose client information without consent EXCEPT when:',choices:['The client\'s competitor requests it','A court order or subpoena requires disclosure','Another CPA firm needs it for a referral','A journalist is investigating the client'],correct:1,exp:'Client confidentiality must be maintained; however, CPAs may disclose information when required by a court order, subpoena, or other legal process.'},
    {q:'A review of interim financial statements by an auditor who also audits the annual FS provides:',choices:['The same level of assurance as an annual audit','Limited (negative) assurance based primarily on inquiries and analytical procedures','No assurance','An adverse or disclaimer opinion'],correct:1,exp:'A review of interim FS provides limited (negative) assurance — "nothing came to our attention" — based on inquiries and analytics, not the extensive testing of a full audit.'},
    {q:'Observation as an audit procedure is MOST useful for:',choices:['Verifying account balance accuracy','Gathering evidence about processes and physical existence at a point in time','Testing mathematical accuracy','Confirming third-party balances'],correct:1,exp:'Observation (watching a client procedure) provides evidence about processes at a specific moment (e.g., inventory count, control execution) but doesn\'t prove ongoing effectiveness.'},
    {q:'When an auditor identifies a going concern issue, the auditor FIRST:',choices:['Immediately issues a disclaimer of opinion','Discusses the matter with management and evaluates their plans to mitigate the issue','Issues an adverse opinion','Withdraws from the engagement'],correct:1,exp:'Upon identifying potential going concern conditions, the auditor discusses management\'s plans (debt restructuring, asset sales, new financing), then evaluates their adequacy before forming an opinion.'},
    {q:'The term "professional judgment" in auditing means:',choices:['Following client preferences','Applying relevant training, knowledge, and experience to make informed decisions about the audit','Selecting the least costly procedures','Deferring all decisions to the engagement partner'],correct:1,exp:'Professional judgment is the application of relevant training and experience to make informed decisions throughout the audit — about materiality, risk assessment, evidence evaluation, and reporting.'},
    {q:'Under GAAS, the auditor should obtain a written management representation letter:',choices:['Before the audit begins','Dated on or near the audit report date, as a condition for issuing the report','Only when the auditor suspects fraud','Only for public company audits'],correct:1,exp:'The management rep letter is dated on or near the auditor\'s report and is a required condition for issuing the audit report. Without it, the auditor must modify the opinion.'},
    {q:'Which of the following assertions is MOST relevant when testing accounts payable for completeness?',choices:['Valuation','Existence','Cutoff and completeness — searching for unrecorded liabilities','Rights and obligations'],correct:2,exp:'Completeness of accounts payable is tested by searching for unrecorded liabilities — reviewing disbursements made after year-end, unpaid invoices, and vendor statements to ensure all obligations at year-end are recorded.'},
  ],
  REG: [
    {q:'Self-employment income of $100,000 \u2014 deductible SE tax for AGI:',choices:['$7,065','$14,130','$7,650','$15,300'],correct:0,exp:'SE tax = $100,000 \u00d7 92.35% \u00d7 15.3% = $14,130. Deductible amount = 50% \u00d7 $14,130 = $7,065.'},
    {q:'A merchant\'s firm offer under UCC Article 2 is irrevocable for a max of:',choices:['30 days','60 days','90 days','3 months'],correct:3,exp:'UCC Article 2: a merchant firm offer is irrevocable for the time stated, not exceeding 3 months.'},
    {q:'Which asset does NOT qualify for Section 179 expensing?',choices:['Manufacturing machinery','Dental office computer','Residential rental property','Office furniture'],correct:2,exp:'Section 179 does not apply to residential rental real property.'},
    {q:'Impossibility of contract performance excuses performance when:',choices:['Performance becomes more expensive than expected','Subject matter is destroyed without either party\'s fault','One party has financial hardship','A better deal is found'],correct:1,exp:'True impossibility excuses performance when: subject matter is destroyed, performance becomes illegal, or a key person dies/becomes incapacitated.'},
    {q:'Long-term capital gains are preferentially taxed at:',choices:['Ordinary income rates','0%, 15%, or 20% depending on taxable income','A flat 28% rate','Same rate as qualified dividends, always 15%'],correct:1,exp:'LTCG (held >1 year) are taxed at preferential rates of 0%, 15%, or 20% depending on the taxpayer\'s taxable income.'},
    {q:'In Chapter 7 bankruptcy, the highest priority unsecured claim is:',choices:['Secured creditors','Employee wages up to a limit','Domestic support obligations (child support, alimony)','Administrative expenses of the estate'],correct:2,exp:'Domestic support obligations have the highest priority among unsecured claims in Chapter 7 distribution.'},
    {q:'The IRS statute of limitations for a fraudulent return is:',choices:['3 years','6 years','No limit \u2014 indefinite','5 years'],correct:2,exp:'No statute of limitations applies when a fraudulent return is filed or a taxpayer willfully attempts to evade tax.'},
    {q:'An S corporation is correctly described as:',choices:['A corporation taxed at corporate and individual levels','Pass-through entity with corporate-level tax on built-in gains only (BIG tax)','A pass-through entity limited to 100 shareholders and one class of stock','Subject to corporate alternative minimum tax'],correct:2,exp:'S corps are pass-through entities; generally no entity-level tax, limited to 100 eligible shareholders, and one class of stock.'},
    {q:'Apparent authority in agency law arises from:',choices:['Principal explicitly authorizing the act','Third party\'s reasonable belief of authority based on principal\'s conduct','Agent exceeding actual authority','Agent having written authorization'],correct:1,exp:'Apparent authority arises from the principal\'s representations or conduct that lead third parties to reasonably believe the agent has authority.'},
    {q:'A partnership distributes property with FMV $50,000 and basis $30,000. Partner\'s basis in the distributed property is:',choices:['$50,000 (FMV)','$30,000 (partnership\'s basis)','$20,000 (difference)','$0'],correct:1,exp:'In a non-liquidating distribution, the partner takes the partnership\'s adjusted basis in the distributed property ($30,000).'},
    {q:'Under UETA, an electronic signature:',choices:['Is only valid if notarized','Has the same legal effect as a handwritten signature','Is only valid for contracts over $500','Is not admissible as evidence in court'],correct:1,exp:'UETA (and ESIGN Act) give electronic signatures the same legal effect as paper signatures.'},
    {q:'A taxpayer sells her primary residence (owned/used 3 years) for $450,000 (basis $200,000). Taxable gain:',choices:['$250,000 fully taxable','$0 \u2014 all excluded under Section 121','$150,000 taxable','$100,000 taxable'],correct:1,exp:'Section 121 excludes up to $250,000 ($500,000 MFJ) of gain if owned and used as principal residence for 2 of the last 5 years.'},
    {q:'A gift received by an individual is:',choices:['Fully taxable ordinary income','Excluded from gross income under IRC \u00a7102','Taxed at capital gain rates','Taxable only above $15,000'],correct:1,exp:'Gifts received are excluded from the recipient\'s gross income (the donor may owe gift tax, not the recipient).'},
    {q:'Guaranteed payments to LLC members are:',choices:['Tax-free distributions','Deductible by LLC; ordinary income to the member','Capital gains to the member','Never subject to self-employment tax'],correct:1,exp:'Guaranteed payments are deductible by the LLC and treated as ordinary income to the member, generally subject to SE tax.'},
    {q:'The "kiddie tax" applies to unearned income of children under age:',choices:['14','17','19 (or 24 if full-time student)','21'],correct:2,exp:'The kiddie tax taxes unearned income of children under 19 (or full-time students under 24) at the parent\'s marginal rate.'},
    {q:'A C corporation\'s charitable contribution deduction is limited to:',choices:['5% of taxable income','10% of taxable income before the contribution deduction','25% of taxable income','Unlimited for qualifying organizations'],correct:1,exp:'Corporate charitable contributions are limited to 10% of taxable income before the deduction; excess carries forward 5 years.'},
    {q:'Under UCC, risk of loss in a shipment contract passes to the buyer:',choices:['When the buyer physically receives the goods','When the seller delivers goods to the carrier','When the buyer pays for the goods','At the time of contract formation'],correct:1,exp:'In a shipment contract (e.g., FOB shipping point), risk of loss passes when the seller duly delivers to the carrier.'},
    {q:'A tax return preparer who recklessly disregards rules resulting in an understatement faces a minimum penalty of:',choices:['$250','$1,000 or 50% of fee (whichever is greater)','$5,000 or 75% of fee (whichever is greater)','No penalty without proven fraud'],correct:2,exp:'IRC \u00a76694(b): reckless or intentional disregard of rules carries a penalty of the greater of $5,000 or 75% of income derived from the return.'},
    {q:'Under the assignment of rights in contract law, the assignee:',choices:['Takes the rights subject to any defenses the obligor has against the assignor','Gets greater rights than the assignor','Is not bound by original contract terms','Must obtain obligor consent for assignment to be valid'],correct:0,exp:'An assignee takes the rights as they existed \u2014 subject to any defenses the obligor had against the original assignor.'},
    {q:'A taxpayer has a $20,000 casualty loss from a non-federally declared disaster. Deductibility under TCJA:',choices:['Fully deductible as miscellaneous itemized deduction','Only deductible for federally declared disasters, subject to 10% AGI floor','Deductible in full against ordinary income','Deductible as a capital loss'],correct:1,exp:'Post-TCJA, personal casualty losses are only deductible if from a federally declared disaster and only to the extent they exceed $100 per event plus 10% of AGI.'},
    {q:'Which of the following is a characteristic of a general partnership?',choices:['Partners have limited liability','All partners have unlimited personal liability for partnership debts','Requires formal written agreement to form','Partners are not agents of the partnership'],correct:1,exp:'In a general partnership, all general partners have unlimited personal liability for the debts and obligations of the partnership.'},
    {q:'The wash sale rule disallows a loss when substantially identical securities are repurchased within:',choices:['15 days before or after the sale','30 days before or after the sale','60 days after the sale','90 days before or after the sale'],correct:1,exp:'The wash sale rule (IRC \u00a71091) disallows a loss if substantially identical securities are purchased within 30 days before or after the sale date.'},
    {q:'Under the Sarbanes-Oxley Act, the CEO and CFO must certify quarterly and annual reports. Knowingly false certifications carry criminal penalties of up to:',choices:['$1 million and 10 years','$5 million and 20 years','$500,000 and 5 years','$2 million and 15 years'],correct:1,exp:'SOX Section 906: willfully false certifications carry penalties of up to $5 million in fines and 20 years in prison.'},
    {q:'Which form of business organization best shields all owners from personal liability with a single level of taxation?',choices:['General partnership','C corporation','LLC taxed as partnership','S corporation with >100 shareholders'],correct:2,exp:'An LLC taxed as a partnership provides limited liability for all members and pass-through taxation, avoiding the double taxation of a C corp.'},
    {q:'An offer is terminated by operation of law if:',choices:['Offeree asks a question about terms','Offeree makes a counter-offer','The subject matter is destroyed before acceptance','Offeror sends a better offer to someone else'],correct:2,exp:'Destruction of the subject matter, death or incapacity of a party, or intervening illegality terminates an offer by operation of law.'},
    {q:'IRC Section 1031 like-kind exchange applies to:',choices:['All personal property','Real property held for productive use or investment only (post-TCJA)','Any business asset exchange','Publicly traded securities'],correct:1,exp:'Post-TCJA, Section 1031 deferral is limited to real property held for productive use in a trade/business or for investment. Personal property no longer qualifies.'},
    {q:'Under CERCLA (Superfund), liability for environmental cleanup is:',choices:['Limited to current property owners only','Joint and several, and can apply to current owners, past owners, generators, and transporters','Only applicable to the original polluter','Limited to companies with over $10M in revenue'],correct:1,exp:'CERCLA imposes strict, joint and several, and retroactive liability on a broad range of potentially responsible parties (PRPs) regardless of fault.'},
    {q:'In a Chapter 11 bankruptcy reorganization, the debtor-in-possession:',choices:['Loses all management control','Continues to operate the business under bankruptcy court supervision','Is replaced by a trustee immediately','Must liquidate assets within 30 days'],correct:1,exp:'In Chapter 11, the debtor typically continues operating as a debtor-in-possession under court supervision while restructuring its debts.'},
    {q:'A partnership\'s tax year must generally conform to:',choices:['Calendar year unless business purpose exists','The fiscal year of the majority partner','A June 30 fiscal year','Any year the partners choose'],correct:0,exp:'Partnerships generally must use the tax year of the majority partners; if no majority, the principal partners\' year; if none applies, the calendar year, unless a business purpose exception applies.'},
    {q:'The alternative minimum tax (AMT) preference item that most commonly affects individuals is:',choices:['Standard deduction','Accelerated depreciation on personal property','ISO stock option spread at exercise','Both B and C'],correct:3,exp:'Common AMT preference items include accelerated depreciation (vs. ADS) and ISO stock option spreads at exercise, among others.'},
    {q:'Under the passive activity rules, a real estate professional can deduct rental losses against ordinary income if:',choices:['They own at least one rental property','More than 50% of personal services are in real property trades/businesses AND more than 750 hours per year','They have a real estate license','Their AGI is under $100,000'],correct:1,exp:'IRC §469(c)(7): a taxpayer qualifies as a real estate professional if >50% of personal services are in real property trades/businesses and they spend >750 hours annually, allowing rental losses to be treated as non-passive.'},
    {q:'A taxpayer receives a $10,000 insurance settlement for a stolen business laptop with a $4,000 adjusted basis. The gain recognized is:',choices:['$0 — insurance proceeds are tax-free','$6,000 ordinary gain','$6,000 Section 1231 gain','$10,000 ordinary income'],correct:2,exp:'The $6,000 gain ($10,000 − $4,000) on an involuntary conversion of a business asset is a Section 1231 gain, potentially taxed at long-term capital gain rates.'},
    {q:'The accuracy-related penalty under IRC §6662 for negligence or disregard of rules is:',choices:['5% of underpayment','10% of underpayment','20% of underpayment','25% of underpayment'],correct:2,exp:'IRC §6662 imposes a 20% accuracy-related penalty on underpayments due to negligence, disregard of rules, or substantial understatements of income tax.'},
    {q:'Under UCC Article 2, a contract for the sale of goods worth $500 or more must be:',choices:['Verbal agreement witnessed by two parties','In writing and signed by the party against whom enforcement is sought (Statute of Frauds)','Notarized','Filed with the state'],correct:1,exp:'UCC Article 2 Statute of Frauds: contracts for the sale of goods of $500 or more must be evidenced by a writing signed by the party against whom enforcement is sought.'},
    {q:'An individual\'s net capital loss deduction against ordinary income is limited to:',choices:['$1,000 per year','$3,000 per year (excess carries forward indefinitely)','$5,000 per year','Unlimited'],correct:1,exp:'Individuals may deduct up to $3,000 of net capital losses against ordinary income per year; unused losses carry forward indefinitely.'},
    {q:'Which of the following types of income is NOT subject to self-employment tax?',choices:['Sole proprietorship net profit','Net earnings from a partnership interest for a general partner','S corporation shareholder distributions','Schedule C net income'],correct:2,exp:'S corporation distributions are NOT subject to SE tax — only reasonable W-2 wages paid by the S corp to the shareholder-employee are subject to payroll taxes.'},
    {q:'The earned income tax credit (EITC) is a:',choices:['Deduction reducing AGI','Refundable credit for low-to-moderate income workers with earned income','Non-refundable credit for high earners','Credit available to corporations'],correct:1,exp:'The EITC is a refundable tax credit for low-to-moderate income workers — it can reduce tax liability below zero, generating a refund.'},
    {q:'Under contract law, consideration requires:',choices:['A promise to do something already legally required','A bargained-for exchange — each party gives something of legal value','A written agreement only','Monetary payment in all cases'],correct:1,exp:'Consideration requires a bargained-for exchange where each party provides something of legal value — it can be an act, forbearance, or return promise, but not a pre-existing duty.'},
    {q:'The at-risk rules of IRC §465 allow deductions only to the extent of:',choices:['The taxpayer\'s total investment in the activity','Amounts personally at risk — cash contributed plus personally liable debt','The fair market value of assets in the activity','The entity\'s total equity'],correct:1,exp:'Section 465 limits deductions to the amount personally at risk: cash/property contributed plus amounts borrowed for which the taxpayer is personally liable (non-recourse debt generally excluded).'},
    {q:'Under MACRS, residential rental property is depreciated over:',choices:['15 years','27.5 years','39 years','40 years'],correct:1,exp:'Residential rental property (apartments, single-family rentals) uses MACRS straight-line depreciation over 27.5 years. Commercial real property uses 39 years.'},
    {q:'An offer to purchase real estate is irrevocable (option contract) only if:',choices:['The offeror states it in writing','Consideration is given for the option','The agreement is notarized','The offeree accepts within 30 days'],correct:1,exp:'An option contract requires separate consideration to keep the offer open (e.g., $100 paid to hold an offer for 30 days). Without consideration, an offer can be revoked at any time.'},
    {q:'Under the Foreign Corrupt Practices Act (FCPA), US companies are prohibited from:',choices:['Conducting business in foreign countries','Bribing foreign government officials to obtain or retain business','Hiring foreign nationals','Paying taxes in foreign jurisdictions'],correct:1,exp:'The FCPA prohibits US companies (and their agents) from paying bribes to foreign government officials to obtain, retain, or direct business.'},
    {q:'A taxpayer\'s medical expense deduction (itemized) is limited to expenses exceeding:',choices:['2% of AGI','7.5% of AGI','10% of AGI','The standard deduction threshold'],correct:1,exp:'Under TCJA, medical expenses are deductible as an itemized deduction to the extent they exceed 7.5% of AGI.'},
    {q:'Which of the following best describes a Subchapter C corporation\'s tax treatment of dividends received from a domestic subsidiary in which it owns 80%+?',choices:['50% DRD','65% DRD','100% DRD (if consolidated return filed)','No deduction — fully taxable'],correct:2,exp:'A corporation owning 80% or more of another domestic corporation qualifies for a 100% dividends received deduction (if an affiliated group filing consolidated returns).'},
    {q:'Under promissory estoppel, a contract may be enforceable without consideration if:',choices:['The parties are related','There was a clear promise, reasonable reliance, and injustice would result from non-enforcement','Both parties are merchants','The amount exceeds $5,000'],correct:1,exp:'Promissory estoppel substitutes for consideration when: a clear promise was made, the promisee reasonably relied on it, and enforcing the promise is necessary to avoid injustice.'},
    {q:'The Social Security (OASDI) tax rate for employees in the current system is:',choices:['6.2% on all wages','6.2% on wages up to the Social Security wage base','12.4% on all wages','7.65% on wages up to the Social Security wage base'],correct:1,exp:'Employees pay 6.2% OASDI (Social Security) on wages up to the annual wage base, plus 1.45% Medicare on all wages (no cap), for a combined 7.65% FICA rate.'},
    {q:'A taxpayer contributes $20,000 to a traditional IRA when they are covered by an employer retirement plan and their income exceeds the deduction phase-out range. The contribution is:',choices:['Non-deductible; earnings still grow tax-deferred','Deductible in full regardless','Not permitted at all','Deductible at 50%'],correct:0,exp:'Even when the deduction is phased out, taxpayers may make non-deductible traditional IRA contributions; earnings still grow tax-deferred and are taxed upon distribution.'},
    {q:'Under UCC Article 2, "merchantability" as an implied warranty means goods must:',choices:['Be the cheapest available on the market','Pass without objection in the trade, be fit for ordinary use, and be adequately packaged/labeled','Meet custom specifications from the buyer','Be provided with a written warranty'],correct:1,exp:'The implied warranty of merchantability (automatic for merchant sellers) requires goods to be fit for their ordinary purpose, conform to label descriptions, and pass trade standards.'},
    {q:'Which of the following is a deduction FOR AGI (above-the-line)?',choices:['Charitable contributions (non-business)','Mortgage interest on primary residence','Alimony paid under pre-2019 divorce decrees','State and local taxes paid'],correct:2,exp:'Alimony paid under pre-2019 divorce agreements is an above-the-line deduction (for AGI). Post-2018 divorces: alimony is not deductible by the payor or taxable to the recipient.'},
    {q:'An LLC with multiple members elects to be taxed as a corporation and then makes an S election. To be a valid S corp, the LLC must have:',choices:['Any number of members','No more than 100 eligible shareholders, one class of stock, and only eligible shareholders','At least 50% US members only','Members who are all US citizens'],correct:1,exp:'For a valid S election, requirements include: ≤100 shareholders, all shareholders must be eligible (US citizens/residents, estates, certain trusts), and only one class of stock.'},
    {q:'In a negligence claim against a CPA, the element of "proximate cause" requires:',choices:['The CPA knew of potential harm','The CPA\'s negligent act was a substantial factor in causing the plaintiff\'s damages','The CPA breached a contract','The plaintiff suffered emotional distress'],correct:1,exp:'Proximate (legal) cause requires that the CPA\'s negligence was a direct and foreseeable cause of the harm — there must be a causal link between the breach and the damages suffered.'},
    {q:'The child tax credit phases out for married filing jointly taxpayers at AGI above:',choices:['$75,000','$150,000','$200,000','$400,000'],correct:1,exp:'The child tax credit (up to $2,000/child) begins phasing out at $400,000 for MFJ ($200,000 for single filers) under post-TCJA rules (note: amounts can change with legislation).'},
    {q:'Under the Uniform Commercial Code, "good faith" means:',choices:['Acting with a written contract','Honesty in fact and the observance of reasonable commercial standards of fair dealing','Avoiding all verbal agreements','Acting in the best interest of the seller only'],correct:1,exp:'UCC good faith for merchants means honesty in fact AND observance of reasonable commercial standards of fair dealing in the trade — a dual standard.'},
    {q:'Passive activity suspended losses are triggered (allowed) when:',choices:['The taxpayer elects to recognize them annually','The taxpayer disposes of their entire interest in the passive activity in a taxable transaction','The activity becomes profitable','The taxpayer turns 65'],correct:1,exp:'Under IRC §469, suspended passive activity losses are released (become fully deductible) only when the taxpayer disposes of their entire interest in the activity in a fully taxable transaction.'},
    {q:'The net investment income tax (NIIT) under IRC §1411 is:',choices:['3.8% on net investment income for taxpayers above certain AGI thresholds','2.9% on all investment income','A flat $10,000 surcharge','5% on capital gains only'],correct:0,exp:'The NIIT imposes a 3.8% surtax on the lesser of net investment income or the excess of modified AGI over $200,000 (single) / $250,000 (MFJ).'},
    {q:'Under the Statute of Frauds, which of the following does NOT need to be in writing to be enforceable?',choices:['Sale of real estate','Contract that cannot be performed within one year','Sale of goods of $500 or more','Service contract fully performable within 6 months'],correct:3,exp:'The Statute of Frauds requires writings for: real estate sales, contracts not performable within a year, goods ≥$500, suretyship, and marriage contracts. A service contract performable within a year does not need to be in writing.'},
    {q:'Which of the following is a characteristic of a limited liability partnership (LLP)?',choices:['All partners have unlimited personal liability','Partners are shielded from personal liability for other partners\' malpractice or negligence','The LLP is taxed at the entity level','Partners cannot participate in management'],correct:1,exp:'An LLP (common for professional firms) shields partners from personal liability for malpractice or negligence of other partners, while each partner remains liable for their own acts.'},
    {q:'The deduction for home office expenses is available to self-employed individuals when:',choices:['Any part of the home is used for business','A portion of the home is used regularly and exclusively for business, and is the principal place of business','The taxpayer works from home occasionally','The home office is used for business and personal activities'],correct:1,exp:'IRC §280A: home office deductions require regular and exclusive use as the principal place of business (or where clients are met, or a separate structure). Occasional use or mixed-use fails the exclusivity test.'},
    {q:'Under contract law, a unilateral mistake generally:',choices:['Always voids a contract','Does not make a contract voidable unless the other party knew or should have known of the mistake','Always makes the contract enforceable','Requires rescission regardless of circumstances'],correct:1,exp:'A unilateral mistake (only one party is mistaken) generally does not void a contract, unless the non-mistaken party knew or should have known of the error — then courts may allow rescission.'},
    {q:'A taxpayer\'s basis in S corporation stock after the first year: beginning basis $50,000, share of income $10,000, distributions $8,000, share of losses $5,000. Ending basis is:',choices:['$47,000','$55,000','$57,000','$45,000'],correct:0,exp:'S corp stock basis: $50,000 + $10,000 income − $8,000 distributions − $5,000 losses = $47,000. Order: increase by income first, then reduce by distributions, then reduce by losses (but not below zero).'},
  ],
  TCP: [
    {q:'A single-member LLC is treated as _____ by default for tax purposes.',choices:['C Corporation','S Corporation','Disregarded entity (sole proprietorship)','Partnership'],correct:2,exp:'Domestic SMLLCs are disregarded entities by default \u2014 income/expenses flow directly to the owner\'s return.'},
    {q:'The built-in gains (BIG) tax recognition period after an S election is:',choices:['2 years','3 years','5 years','10 years'],correct:2,exp:'Under Section 1374, the BIG tax recognition period is 5 years from the date of the S election.'},
    {q:'Corporate charitable deduction \u2014 taxable income before deduction is $500,000, contribution is $100,000. Deductible:',choices:['$100,000','$50,000','$10,000','$25,000'],correct:1,exp:'10% \u00d7 $500,000 = $50,000 deductible; the $50,000 excess carries forward 5 years.'},
    {q:'Tax-exempt interest income in relation to a corporation\'s earnings and profits (E&P):',choices:['Excluded from E&P','Increases E&P despite being excluded from taxable income','Decreases E&P','Has no effect on E&P'],correct:1,exp:'Tax-exempt interest is excluded from taxable income but increases E&P \u2014 E&P measures the economic capacity to pay dividends.'},
    {q:'Intercompany sales in a consolidated return are:',choices:['Recognized immediately','Deferred/eliminated until goods are sold to parties outside the consolidated group','Subject to double taxation','Taxed at each entity\'s applicable rate'],correct:1,exp:'Intercompany transactions are eliminated until the goods/services are sold to non-members of the consolidated group.'},
    {q:'Section 351 non-recognition requires transferors to control ___% of the corporation immediately after the exchange.',choices:['51%','67%','80%','100%'],correct:2,exp:'Section 351: transferors must control \u226580% of voting stock and \u226580% of all other stock classes immediately after the transfer.'},
    {q:'Dividends received deduction (DRD) for a corporate shareholder owning 20\u201379% of the distributing corporation:',choices:['50%','65%','70%','100%'],correct:1,exp:'Ownership \u226520% but <80%: DRD is 65%. <20% ownership: 50%. \u226580% ownership: 100% (if consolidated return requirements met).'},
    {q:'The accumulated earnings tax is a penalty tax on:',choices:['All retained earnings','Unreasonable accumulations beyond reasonable business needs to avoid paying dividends','C corporations only if publicly traded','Retained earnings exceeding $250,000'],correct:1,exp:'The AET (20%) penalizes C corporations that accumulate earnings beyond reasonable needs to avoid distributing dividends.'},
    {q:'At-risk rules limit loss deductions to the taxpayer\'s:',choices:['Capital account balance','Share of partnership liabilities + cash contributed','Amount at risk \u2014 actual economic exposure in the activity','Outside basis only'],correct:2,exp:'Section 465 limits deductions to the amount at risk \u2014 generally cash invested plus personally liable debt.'},
    {q:'C corporation with December 31 year-end: income tax return due date is:',choices:['March 15','April 15 with no extension possible','March 15 with 6-month extension to September 15','April 15 with automatic 6-month extension to October 15'],correct:3,exp:'C corps (Dec 31 year-end) file by April 15; they can get an automatic 6-month extension to October 15.'},
    {q:'Section 163(j) limits net business interest expense deduction to:',choices:['30% of adjusted taxable income','50% of AGI','25% of business income','No limit \u2014 all deductible'],correct:0,exp:'Section 163(j): business interest deduction limited to 30% of ATI; disallowed excess carries forward indefinitely.'},
    {q:'A partnership\'s inside basis equals:',choices:['Sum of all partners\' outside bases in their interests','FMV of partnership assets','Cost of assets to the partnership at formation','Book value of assets per financial statements'],correct:0,exp:'Inside basis (entity\'s tax basis in assets) equals the sum of all partners\' outside bases in their partnership interests.'},
    {q:'Passive activity losses can offset:',choices:['Ordinary income from employment','Passive activity income only','Capital gains','Any income with proper election'],correct:1,exp:'Passive activity losses can only offset passive activity income; suspended losses are released when the activity is fully disposed of.'},
    {q:'Post-2017 TCJA, net operating losses can be:',choices:['Carried back 2 years and forward 20 years','Carried forward indefinitely, limited to 80% of taxable income','Carried back 3 years and forward 15 years','Carried forward 20 years without limitation'],correct:1,exp:'Post-TCJA: no carryback (generally); carry forward indefinitely; deductible up to 80% of taxable income in the carryforward year.'},
    {q:'A Section 338 election allows a qualifying stock purchase to be treated as:',choices:['A tax-free reorganization','An asset purchase for tax purposes with a step-up in basis','A partnership interest acquisition','A liquidation of the target'],correct:1,exp:'A Section 338 election treats a qualifying stock purchase as a deemed asset acquisition, allowing a step-up in the target\'s asset basis.'},
    {q:'Under Section 1231, net gains are treated as:',choices:['Always ordinary income','Long-term capital gain (subject to lookback recapture)','Short-term capital gain','Section 1245 ordinary recapture income'],correct:1,exp:'Net Section 1231 gains are LTCG; however, prior Section 1231 losses in the past 5 years are "recaptured" as ordinary income first.'},
    {q:'LIFO conformity rule requires that if LIFO is used for tax:',choices:['It is only disclosed in footnotes','It must be used in financial statements presented to shareholders','It applies to payroll records too','It applies only to the filing entity'],correct:1,exp:'The LIFO conformity rule requires that if a taxpayer elects LIFO for tax purposes, it must also use LIFO in financial statements presented to shareholders, creditors, or the public.'},
    {q:'Excess business loss limitation under Section 461(l) applies to:',choices:['C corporations','S corporations only','Non-corporate taxpayers','Partnerships only at the entity level'],correct:2,exp:'Section 461(l) limits non-corporate taxpayers from deducting business losses that exceed the applicable threshold; excess is treated as an NOL carryforward.'},
    {q:'The QBI (qualified business income) deduction under Section 199A is up to ___% of QBI.',choices:['10%','15%','20%','25%'],correct:2,exp:'Section 199A provides a deduction of up to 20% of qualified business income from pass-through entities and sole proprietorships, subject to limitations.'},
    {q:'In a complete liquidation of a corporation, shareholders recognize:',choices:['Ordinary income equal to distributions received','Capital gain or loss equal to FMV received minus their stock basis','No gain or loss','Dividend income to the extent of E&P'],correct:1,exp:'Upon complete liquidation, shareholders treat amounts received as full payment for their stock \u2014 recognizing capital gain or loss.'},
    {q:'A corporation pays a property distribution to shareholders. The distributing corporation recognizes:',choices:['No gain','Gain (but not loss) as if the property were sold at FMV','Loss equal to the decline in value','Gain only if the property is appreciated'],correct:1,exp:'Under Section 311(b), a corporation recognizes gain (but not loss) on a non-liquidating distribution of appreciated property, as if sold at FMV.'},
    {q:'The transfer pricing rules of Section 482 allow the IRS to:',choices:['Set prices on all intercompany transactions','Reallocate income and deductions among commonly controlled entities to reflect arm\'s-length pricing','Prohibit intercompany transactions','Tax both entities on the same transaction'],correct:1,exp:'Section 482 gives the IRS authority to reallocate income, deductions, and credits between commonly controlled entities to clearly reflect income at arm\'s-length prices.'},
    {q:'Under the check-the-box regulations, a two-member LLC is classified as _____ by default.',choices:['C Corporation','S Corporation','Partnership','Disregarded entity'],correct:2,exp:'A domestic multi-member LLC defaults to partnership classification for tax purposes unless it elects to be treated as a corporation.'},
    {q:'Which of the following triggers Section 1245 ordinary income recapture?',choices:['Sale of land at a gain','Sale of depreciable personal property at a gain, to the extent of accumulated depreciation','Sale of a building using straight-line depreciation','Sale of stock in a C corporation'],correct:1,exp:'Section 1245 recaptures prior depreciation deductions on tangible personal property as ordinary income upon sale, to the extent of accumulated depreciation.'},
    {q:'The dividends-paid deduction (DPD) is available to:',choices:['C corporations to reduce corporate income tax','Regulated investment companies (RICs) and REITs to reduce entity-level tax','S corporations to avoid double taxation','Partnerships distributing cash to partners'],correct:1,exp:'RICs (mutual funds) and REITs can deduct dividends paid to shareholders, effectively eliminating entity-level tax on distributed income.'},
    {q:'An S corporation election is made on Form 2553 and must be filed:',choices:['By March 15 of the election year','By April 15 of the election year','No later than March 15 of the election year or March 15 of the prior year','By the end of the first month of the tax year'],correct:2,exp:'Form 2553 must be filed no later than the 15th day of the third month of the tax year for which the election is to apply, or March 15 of the prior year.'},
    {q:'The earnings stripping rules (now codified at Section 163(j)) were primarily designed to prevent:',choices:['Excessive dividend payments','Thin capitalization / excessive interest deductions that shift income out of the US','Passive activity abuses','S corporation losses exceeding basis'],correct:1,exp:'Section 163(j) was designed to prevent earnings stripping \u2014 the use of excessive intercompany debt to shift income to lower-tax jurisdictions.'},
    {q:'A deferred compensation plan that meets the requirements of Section 409A must:',choices:['Be funded and taxable immediately','Defer the inclusion of income in the year of deferral and comply with distribution timing rules','Allow withdrawal at any time without penalty','Be established only by public companies'],correct:1,exp:'Section 409A governs non-qualified deferred comp plans, requiring compliance with deferral elections, permissible distribution events, and timing rules to avoid immediate taxation and penalties.'},
    {q:'Under Section 382, a net operating loss carryforward is limited after:',choices:['A change in accounting method','An ownership change (>50 percentage point shift among 5%+ shareholders in 3 years)','Any acquisition of stock','A bankruptcy filing'],correct:1,exp:'Section 382 limits NOL use following an ownership change \u2014 defined as a >50 percentage-point shift in ownership among 5%-or-more shareholders within a 3-year period.'},
    {q:'Rev. Proc. 2002-39 allows a corporation to change its tax year without IRS approval if it meets:',choices:['The natural business year test','The 25% gross receipts test','Either the natural business year or ownership tax year test','None \u2014 IRS approval is always required'],correct:2,exp:'Automatic approval to change a tax year is available under Rev. Proc. 2002-39 if the entity qualifies under the natural business year or ownership tax year tests.'},
    {q:'The basis of property received in a tax-free Section 351 exchange is:',choices:['Fair market value of property transferred','Carryover basis \u2014 same as transferor\'s basis in the property transferred','Zero','FMV less any gain recognized'],correct:1,exp:'In a Section 351 exchange, both the corporation and shareholder take carryover basis. The corporation\'s basis in property received = transferor\'s adjusted basis (plus any gain recognized by the transferor).'},
    {q:'A partner\'s outside basis is increased by:',choices:['Cash distributions received','Share of partnership losses','Share of partnership income and additional contributions','Guaranteed payments received only'],correct:2,exp:'A partner\'s outside basis increases with: additional contributions, share of partnership income (including tax-exempt income), and share of increases in partnership liabilities.'},
    {q:'Which of the following is a "hot asset" (ordinary income asset) under IRC \u00a7751?',choices:['Capital assets held more than 1 year','Unrealized receivables and inventory items','Investment securities','Real property held for investment'],correct:1,exp:'Section 751 "hot assets" \u2014 unrealized receivables (e.g., accounts receivable of a cash-basis taxpayer) and inventory \u2014 generate ordinary income upon a partnership interest sale or distribution.'},
    {q:'Under IRC \u00a7704(b), a special allocation in a partnership agreement is respected by the IRS only if it has:',choices:['A majority partner vote','Substantial economic effect \u2014 it actually impacts the partners\' economic situation, not just tax liability','Been reviewed by a tax attorney','The consent of all partners in writing'],correct:1,exp:'Special allocations must have substantial economic effect to be respected. This requires proper capital accounts, deficit restoration obligations (or qualified income offset), and liquidation in accordance with capital accounts.'},
    {q:'A C corporation with a fiscal year ending June 30 must file its tax return (without extension) by:',choices:['March 15','September 15','October 15','April 15'],correct:1,exp:'For C corporations with a June 30 fiscal year-end, a special exception applies: the return is due September 15 (15th day of the 3rd month after year-end), not the 4th-month rule that applies to most other fiscal year C corporations.'},
    {q:'An S corporation shareholder\'s basis is reduced (but not below zero) by:',choices:['Share of S corp income','Additional paid-in capital contributions','Share of S corp losses and distributions','Guaranteed payments received'],correct:2,exp:'An S corp shareholder\'s basis is reduced by: distributions, share of losses, and non-deductible non-capital expenses. It is increased by contributions and income.'},
    {q:'Under the consolidated return rules, a subsidiary must be at least ___% owned (by vote and value) by the common parent.',choices:['51%','67%','80%','100%'],correct:2,exp:'An affiliated group eligible to file a consolidated return requires 80% ownership (by vote AND value) of the subsidiary by the parent or another group member.'},
    {q:'The purpose of the earnings stripping limitation (IRC \u00a7163(j)) is primarily to:',choices:['Prevent double taxation of dividends','Limit excessive interest deductions that artificially reduce US taxable income','Require capitalization of R&D costs','Prevent abuse of the DRD'],correct:1,exp:'Section 163(j) was designed to prevent earnings stripping \u2014 using large intercompany interest payments to shift profits to lower-tax jurisdictions, reducing US taxable income.'},
    {q:'A shareholder of an S corporation receives a $50,000 distribution when their stock basis is $30,000. The result is:',choices:['$50,000 ordinary income','$30,000 reduces basis to zero; $20,000 treated as capital gain (assuming no E&P)','$20,000 ordinary income','$50,000 capital gain'],correct:1,exp:'S corp distributions reduce stock basis first. When distributions exceed basis, the excess is capital gain (assuming no accumulated C corp E&P, in which case it would be a dividend to the extent of E&P).'},
    {q:'Under Section 704(c), when appreciated property is contributed to a partnership, the built-in gain upon sale is allocated to:',choices:['All partners equally','The contributing partner who contributed the property','Non-contributing partners','The partner with the highest tax rate'],correct:1,exp:'Section 704(c) requires built-in gains (or losses) on contributed property to be allocated back to the contributing partner upon the partnership\'s sale of that property.'},
    {q:'The personal holding company (PHC) tax applies when:',choices:['A C corporation is owned by >5 shareholders and earns passive income','A closely held C corporation (owned by \u22645 individuals owning >50%) has \u226560% of AGI from personal holding company income','An S corporation fails its passive income test','Any C corporation earns investment income'],correct:1,exp:'The PHC tax (20%) applies when: \u22645 individuals own >50% of stock (by value), and \u226560% of adjusted ordinary gross income is from personal holding company income (dividends, rents, royalties, personal service contracts).'},
    {q:'Under Section 1245, ordinary income recapture applies to:',choices:['All gains on real property','Gains on depreciable personal property to the extent of all prior depreciation deductions taken','Only gains exceeding fair market value','Long-term capital gains on equipment'],correct:1,exp:'Section 1245 recaptures all prior depreciation on depreciable personal property (equipment, machinery) as ordinary income, up to the amount of gain realized.'},
    {q:'For tax purposes, organization costs of a corporation:',choices:['Are never deductible','May be amortized over 15 years with an immediate deduction for the first $5,000 (phased out above $50,000)','Must be capitalized with no amortization','Are expensed in year 1 fully'],correct:1,exp:'IRC \u00a7248: corporations can immediately expense up to $5,000 of organizational costs (reduced dollar-for-dollar when total costs exceed $50,000) and amortize the remainder over 180 months (15 years).'},
    {q:'The alternative minimum tax (AMT) for corporations was:',choices:['Permanently eliminated by TCJA for all corporations','Reinstated for corporations with average annual adjusted financial statement income over $1 billion (CAMT under IRA 2022)','Still applies to all C corporations at 20%','Only applicable to S corporations'],correct:1,exp:'The TCJA eliminated the corporate AMT for tax years beginning after 2017; the Inflation Reduction Act of 2022 introduced the Corporate AMT (CAMT) at 15% on adjusted financial statement income for large corporations (AFSI > $1B).'},
    {q:'Under the TCJA, the corporate income tax rate is:',choices:['21% flat rate','28% graduated rates','35% flat rate','25% flat rate'],correct:0,exp:'The TCJA reduced the corporate income tax rate to a flat 21% for tax years beginning after December 31, 2017, replacing the prior graduated rate structure.'},
    {q:'GILTI (Global Intangible Low-Taxed Income) is a provision that:',choices:['Exempts all foreign income from US taxation','Requires US shareholders of CFCs to include certain low-taxed foreign income in their US taxable income','Provides a 100% deduction for foreign dividends','Applies only to foreign partnerships'],correct:1,exp:'GILTI (IRC \u00a7951A) requires US shareholders owning 10%+ of a controlled foreign corporation (CFC) to include low-taxed foreign intangible income in gross income, subject to various deductions and credits.'},
    {q:'Under the TCJA\'s BEAT (Base Erosion and Anti-Abuse Tax), it applies to:',choices:['All US corporations','US corporations with average annual gross receipts \u2265$500M and a base erosion percentage \u22653%','Foreign corporations only','S corporations with foreign income'],correct:1,exp:'BEAT (IRC \u00a759A) applies to corporations with \u2265$500M in gross receipts and a base erosion percentage of \u22653%, imposing a 10% minimum tax on modified taxable income.'},
    {q:'The Foreign Tax Credit (FTC) allows US taxpayers to:',choices:['Exclude all foreign income from US taxation','Reduce their US tax liability dollar-for-dollar by foreign taxes paid, subject to limitations','Deduct foreign taxes as a business expense only','Defer US taxation on foreign income indefinitely'],correct:1,exp:'The FTC (IRC \u00a7901) provides a credit for foreign income taxes paid, reducing dollar-for-dollar US tax on foreign income. It is limited to the US tax on foreign-source income (per-basket limitation under \u00a7904).'},
    {q:'A tax preparer who takes an "unreasonable position" on a return is subject to a penalty equal to:',choices:['$250 or 50% of income from the return (whichever is greater)','The greater of $1,000 or 15% of income derived','The greater of $250 or 10% of tax shown','$500 flat penalty'],correct:0,exp:'IRC \u00a76694(a): a penalty of the greater of $1,000 or 15% of income derived applies to an "unreasonable position." Under the original rules, the penalty was $250; check current IRC for current thresholds.'},
    {q:'Under Subchapter K, the "ceiling rule" limitation applies to:',choices:['Guaranteed payments exceeding $1M','Section 704(c) allocations when the ceiling (the partnership\'s gain) limits the allocation to the non-contributing partner','At-risk limitations on loss deductions','The 30% business interest deduction limitation'],correct:1,exp:'The ceiling rule limits Section 704(c) allocations: the non-contributing partner\'s allocation cannot exceed the partnership\'s total gain on the asset, even if the tax gain is less than the book gain.'},
    {q:'An S corporation with prior C corp accumulated earnings and profits (E&P) distributes cash. The distribution is first treated as:',choices:['Capital gain','From accumulated adjustments account (AAA), then E&P (taxable dividend), then return of basis','Ordinary income immediately','Tax-free return of capital'],correct:1,exp:'S corp distributions are applied in order: first from AAA (tax-free to extent of basis), then from prior C corp E&P (taxable dividend), then return of basis, then capital gain.'},
    {q:'The TCJA introduced 100% bonus depreciation for qualified property placed in service after September 27, 2017. This phases down:',choices:['Immediately in 2023','Starting in 2023 (80%), 2024 (60%), 2025 (40%), 2026 (20%), 0% in 2027','Was made permanent by legislation','Only for property over $1M'],correct:1,exp:'Post-TCJA 100% bonus depreciation phases down: 80% (2023), 60% (2024), 40% (2025), 20% (2026), 0% (2027) for most property, absent new legislation.'},
    {q:'Under the installment method (IRC \u00a7453), gain is recognized:',choices:['Entirely in the year of sale','As payments are received, in proportion to the gross profit percentage','Only when the final installment is received','Based on FMV of the installment obligation'],correct:1,exp:'IRC \u00a7453 installment method: each payment received includes principal and gain. Gain recognized = payment received \u00d7 gross profit percentage (gross profit / contract price).'},
    {q:'A C corporation can carry forward a net operating loss generated in tax years after 2017:',choices:['20 years, fully offsetting income','Indefinitely, limited to 80% of taxable income in the carryforward year','5 years only','3 years back and 20 years forward'],correct:1,exp:'Post-TCJA NOLs have no carryback (generally), carry forward indefinitely, and are limited to 80% of taxable income in the year of deduction.'},
    {q:'The step-up in basis of inherited property (IRC \u00a71014) means:',choices:['The heir takes the decedent\'s original cost basis','The heir\'s basis is the fair market value on the date of death (or alternate valuation date)','The heir takes basis equal to estate tax value','No basis \u2014 all gain is taxable'],correct:1,exp:'IRC \u00a71014 provides a step-up (or step-down) in basis for inherited assets to fair market value on the date of death, eliminating appreciation that occurred during the decedent\'s lifetime.'},
    {q:'The election to treat a subsidiary\'s stock purchase as an asset acquisition (Section 338(h)(10)) requires:',choices:['Only the buyer\'s consent','The joint consent of both the buyer and seller (selling consolidated group or S corp shareholders)','Court approval','IRS advance approval'],correct:1,exp:'A \u00a7338(h)(10) election requires the joint filing by both the acquirer and the target\'s selling consolidated group (or S corp shareholders), allowing the target to be treated as if it sold its assets.'},
    {q:'Under the TCJA, the deduction for state and local taxes (SALT) for individuals is:',choices:['Unlimited','Capped at $10,000 per year ($5,000 for married filing separately)','Eliminated entirely','Limited to property taxes only'],correct:1,exp:'TCJA capped the individual SALT deduction (state/local income or sales taxes + property taxes) at $10,000 ($5,000 MFS) for tax years 2018-2025.'},
    {q:'Which of the following is an example of a "tax shelter" subject to registration and disclosure requirements?',choices:['Standard depreciation deductions','A listed transaction designated by the IRS as a tax avoidance scheme','Standard retirement plan contributions','The standard deduction'],correct:1,exp:'Listed transactions are identified abusive tax shelters that must be disclosed. Participants and material advisors face strict reporting requirements and significant penalties for non-disclosure.'},
    {q:'Under the partnership basis rules, a recourse liability is allocated to the partner who:',choices:['Has the largest capital account','Bears the economic risk of loss','Contributed the most cash','Is the managing partner'],correct:1,exp:'Recourse liabilities are allocated to the partner who bears the economic risk of loss \u2014 typically the partner personally obligated to repay if the partnership cannot.'},
    {q:'The "check-the-box" regulations allow an eligible entity to elect its classification. Which entity CANNOT use check-the-box?',choices:['Single-member LLC','Two-member LLC','Per se corporation (e.g., a publicly traded domestic corporation)','Foreign eligible entity'],correct:2,exp:'Per se corporations (certain domestic and foreign entities automatically classified as corporations by regulation, such as publicly traded domestic corporations) cannot elect a different classification \u2014 check-the-box does not apply to them.'},
  ],
  BAR: [
    {q:'The DuPont formula expresses ROE as:',choices:['Net income / Total assets','Net profit margin \u00d7 Asset turnover \u00d7 Equity multiplier','EBIT / Total equity','Revenue / Equity'],correct:1,exp:'DuPont: ROE = Net profit margin \u00d7 Asset turnover \u00d7 Financial leverage (equity multiplier).'},
    {q:'Free cash flow equals:',choices:['Net income + depreciation','Operating cash flow \u2013 capital expenditures','EBITDA \u2013 interest expense','Revenue \u2013 total operating expenses'],correct:1,exp:'FCF = Operating cash flow \u2013 Capital expenditures; the cash available after maintaining/expanding asset base.'},
    {q:'The quick ratio excludes _____ from the numerator.',choices:['Cash','Marketable securities','Inventory','Accounts receivable'],correct:2,exp:'Quick ratio = (Cash + Marketable securities + AR) / Current liabilities. Inventory is excluded as the least liquid current asset.'},
    {q:'EBITDA is used to compare companies because it:',choices:['Measures net cash flow directly','Eliminates effects of financing, accounting, and tax differences','Includes working capital changes','Equals free cash flow'],correct:1,exp:'EBITDA normalizes earnings by removing interest, taxes, depreciation, and amortization, enabling cross-company and cross-industry comparison.'},
    {q:'Which financing source has the lowest after-tax cost for a profitable C corporation?',choices:['Common equity','Preferred stock','Debt (interest is tax-deductible)','Retained earnings'],correct:2,exp:'Debt has the lowest after-tax cost because interest expense is tax-deductible, reducing its effective cost vs. equity.'},
    {q:'Weighted average cost of capital (WACC) is used as:',choices:['A profitability metric','The discount rate in DCF valuations to represent the overall required return','A measure of liquidity','An indication of leverage'],correct:1,exp:'WACC is the blended required return on a firm\'s capital (debt + equity) and serves as the discount rate in DCF analysis.'},
    {q:'Operating leverage measures the sensitivity of:',choices:['Debt-to-equity ratio','Operating income to changes in revenue','Financial risk','Asset utilization efficiency'],correct:1,exp:'Degree of Operating Leverage (DOL) = % change in EBIT / % change in revenue. High fixed costs = high operating leverage.'},
    {q:'The Gordon Growth Model values a stock as:',choices:['EPS / discount rate','D1 / (required return \u2013 sustainable growth rate)','Book value per share','FCF / WACC'],correct:1,exp:'Gordon Growth Model: P = D1 / (r \u2013 g), where D1 is next year\'s dividend, r is the required return, and g is the constant growth rate.'},
    {q:'A positive EVA (Economic Value Added) indicates:',choices:['The firm has positive net income','The firm earns above its cost of capital, creating value','Stock price is rising','The firm has no financial leverage'],correct:1,exp:'EVA = NOPAT \u2013 (WACC \u00d7 Invested Capital). Positive EVA means returns exceed the cost of capital, creating shareholder value.'},
    {q:'Days Sales Outstanding (DSO) measures:',choices:['Days to sell inventory','Average collection period for accounts receivable','Days payable to suppliers','Length of operating cycle'],correct:1,exp:'DSO = (AR / Revenue) \u00d7 365. Measures how quickly a company collects its receivables.'},
    {q:'Horizontal analysis compares:',choices:['Different companies in the same period','One company\'s results across multiple time periods','Line items as percentage of base figure in same period','Company results to industry benchmarks'],correct:1,exp:'Horizontal (trend) analysis compares financial data across periods to identify trends and growth rates.'},
    {q:'A company with high fixed costs relative to variable costs has:',choices:['High financial leverage and low operating leverage','Low operating leverage','High operating leverage, meaning profits are more sensitive to revenue changes','Low break-even point'],correct:2,exp:'High fixed costs relative to variable costs = high operating leverage \u2014 profits accelerate (or decline) more dramatically with revenue changes.'},
    {q:'Accounts payable days (DPO) increasing suggests:',choices:['Company is collecting receivables faster','Company is taking longer to pay suppliers','Higher inventory turnover','Lower liquidity always'],correct:1,exp:'Rising DPO means the company is taking longer to pay suppliers \u2014 which may conserve cash but could strain supplier relationships.'},
    {q:'The price/earnings (P/E) ratio is defined as:',choices:['Market price per share / book value per share','Market price per share / earnings per share','Dividends per share / earnings per share','Net income / total equity'],correct:1,exp:'P/E = Market price per share / Earnings per share. It reflects how much investors are paying for each dollar of earnings.'},
    {q:'Net present value (NPV) > 0 means:',choices:['Project earns exactly the required return','Project returns more than the cost of capital \u2014 it creates value','Project has a short payback period','Project has low risk'],correct:1,exp:'NPV > 0 means the present value of future cash flows exceeds the initial investment, meaning the project generates a return above the discount rate.'},
    {q:'The internal rate of return (IRR) is:',choices:['The discount rate that maximizes NPV','The discount rate at which NPV = 0','The rate of return on equity','Annual cash flow / initial investment'],correct:1,exp:'IRR is the discount rate at which the present value of future cash flows equals the initial investment (NPV = 0).'},
    {q:'A leveraged buyout (LBO) is characterized by:',choices:['Acquisition funded primarily with common equity','Acquisition funded with a significant portion of debt using the target\'s assets as collateral','A merger of equals with no debt','A government-funded acquisition'],correct:1,exp:'An LBO uses a large proportion of debt (often 60-90%), secured by the target\'s assets and cash flows, to acquire a company.'},
    {q:'Enterprise value (EV) equals:',choices:['Market capitalization only','Market cap + debt \u2013 cash and equivalents','Total assets \u2013 total liabilities','Revenue \u00d7 P/E multiple'],correct:1,exp:'EV = Market cap + total debt \u2013 cash. It represents the total value of the firm to all capital providers, independent of capital structure.'},
    {q:'The payback period method ignores:',choices:['Initial investment','Cash flows after the payback period and the time value of money','Operating costs','Annual cash inflows'],correct:1,exp:'The payback period ignores the time value of money and all cash flows beyond the payback period \u2014 a significant limitation.'},
    {q:'Vertical (common-size) analysis expresses each line item as a percentage of:',choices:['Prior year\'s total','Industry average','A base figure (revenue for P&L; total assets for balance sheet)','Number of shares outstanding'],correct:2,exp:'Vertical analysis converts dollar amounts to percentages of a base: revenue for the income statement, total assets for the balance sheet.'},
    {q:'Which ratio best measures short-term liquidity including only the most liquid assets?',choices:['Current ratio','Quick ratio','Cash ratio (cash + equivalents / current liabilities)','Debt-to-equity ratio'],correct:2,exp:'The cash ratio is the most conservative liquidity measure, using only cash and cash equivalents relative to current liabilities.'},
    {q:'The sustainable growth rate formula is:',choices:['ROE \u00d7 dividend payout ratio','ROE \u00d7 (1 \u2013 dividend payout ratio) = ROE \u00d7 retention ratio','Net income / total assets','EBITDA / interest expense'],correct:1,exp:'Sustainable growth rate = ROE \u00d7 retention ratio (1 \u2013 dividend payout ratio). It represents the maximum growth achievable without external equity financing.'},
    {q:'In discounted cash flow (DCF) analysis, the terminal value typically represents:',choices:['The value of fixed assets at the end of the forecast period','The present value of all cash flows beyond the explicit forecast period','The net salvage value of assets','Total dividends paid during the forecast period'],correct:1,exp:'Terminal value captures the present value of all cash flows beyond the explicit forecast period, often the largest component of a DCF valuation.'},
    {q:'The Altman Z-score is a model that predicts:',choices:['Stock price appreciation','Probability of corporate bankruptcy within 2 years','Optimal capital structure','Earnings quality'],correct:1,exp:'The Altman Z-score uses five financial ratios to predict the probability of a company filing for bankruptcy within two years.'},
    {q:'A company\'s operating cash flow is negative but net income is positive. The most likely cause is:',choices:['Large dividend payments','Significant increase in working capital (AR, inventory)','High capital expenditures','Large debt repayments'],correct:1,exp:'Growing working capital (AR, inventory increasing faster than AP) consumes cash, making OCF negative despite positive net income.'},
    {q:'Interest coverage ratio = EBIT / Interest expense. A ratio below 1.0 means:',choices:['Strong debt capacity','The company cannot cover interest from operating income','Low leverage','Excellent credit rating'],correct:1,exp:'Interest coverage < 1.0 means EBIT is insufficient to cover interest expense \u2014 a significant financial distress signal.'},
    {q:'Which valuation multiple is most appropriate when comparing companies with different capital structures?',choices:['P/E ratio','EV/EBITDA','Price/book value','Dividend yield'],correct:1,exp:'EV/EBITDA is capital-structure neutral because it uses enterprise value (all providers) and EBITDA (pre-interest) \u2014 making it ideal for cross-company comparison regardless of leverage.'},
    {q:'Break-even analysis determines the sales volume at which:',choices:['Net income equals the prior year','Total revenue equals total costs (fixed + variable)','Gross margin equals 50%','Operating leverage equals 1'],correct:1,exp:'Break-even = Fixed costs / Contribution margin per unit. At this point, total revenue = total costs and net income = $0.'},
    {q:'Return on invested capital (ROIC) measures:',choices:['Return to common shareholders only','How efficiently a company generates returns on all capital employed (debt + equity)','Dividend yield','Annual revenue growth'],correct:1,exp:'ROIC = NOPAT / Invested Capital. It measures operational efficiency in generating returns on all the capital a company has deployed.'},
    {q:'A higher asset turnover ratio (Revenue / Average Total Assets) generally indicates:',choices:['The company has too little debt','The company generates more revenue per dollar of assets \u2014 higher efficiency','The company is over-leveraged','The company has excess cash'],correct:1,exp:'Higher asset turnover indicates the company is generating more revenue from its asset base, reflecting greater operational efficiency.'},
    {q:'Which financial metric measures the proportion of earnings paid to shareholders as dividends?',choices:['Payout ratio (dividends per share / EPS)','Retention ratio','Dividend yield','P/E ratio'],correct:0,exp:'The dividend payout ratio = dividends per share / earnings per share. The retention ratio = 1 \u2212 payout ratio.'},
    {q:'A company\'s debt-to-equity ratio increases from 0.5 to 1.5. This most likely indicates:',choices:['Reduced financial risk','Increased financial leverage and risk','Improved asset efficiency','Better operating performance'],correct:1,exp:'A higher debt-to-equity ratio means more of the company\'s assets are financed by debt versus equity \u2014 increasing financial leverage and the risk of financial distress.'},
    {q:'Under the Capital Asset Pricing Model (CAPM), the expected return of a stock equals:',choices:['Risk-free rate \u00d7 beta','Risk-free rate + beta \u00d7 (market return \u2212 risk-free rate)','Market return / beta','Dividend yield + growth rate'],correct:1,exp:'CAPM: E(R) = Rf + \u03b2(Rm \u2212 Rf). The expected return equals the risk-free rate plus beta times the equity risk premium (market return minus risk-free rate).'},
    {q:'Working capital is defined as:',choices:['Total assets minus total liabilities','Current assets minus current liabilities','Cash and equivalents only','Net income plus depreciation'],correct:1,exp:'Working capital = Current assets \u2212 Current liabilities. It measures short-term liquidity and operational efficiency.'},
    {q:'In a discounted cash flow (DCF) model, increasing the discount rate will:',choices:['Increase the present value of future cash flows','Decrease the present value \u2014 higher discount rate means lower PV','Have no effect on PV','Only affect terminal value, not near-term cash flows'],correct:1,exp:'A higher discount rate reduces the present value of future cash flows \u2014 the same future dollar is worth less today when discounted at a higher rate.'},
    {q:'The degree of financial leverage (DFL) measures:',choices:['The ratio of fixed to variable costs','The percentage change in EPS relative to a percentage change in EBIT','The company\'s total debt load','Asset utilization efficiency'],correct:1,exp:'DFL = % change in EPS / % change in EBIT. High financial leverage (debt with fixed interest) amplifies the effect of operating income changes on earnings per share.'},
    {q:'When a company repurchases its own stock (treasury stock), the effect on the balance sheet is:',choices:['Total assets increase; equity increases','Total assets decrease; equity decreases by the repurchase cost','No effect on equity \u2014 only assets change','Liabilities increase; equity is unchanged'],correct:1,exp:'Share repurchases reduce cash (an asset) and reduce equity (treasury stock is a contra-equity account), decreasing both assets and total equity by the repurchase cost.'},
    {q:'A company\'s times interest earned (TIE) ratio of 1.2 signals:',choices:['Very strong debt service coverage','Barely sufficient operating income to cover interest; thin margin of safety','No debt outstanding','Excellent credit quality'],correct:1,exp:'TIE = EBIT / Interest expense. A ratio of 1.2 means EBIT only covers interest 1.2 times \u2014 a small decline in earnings could result in inability to service debt.'},
    {q:'Which of the following best describes "economic moat" in business analysis?',choices:['A company\'s cash reserves','A sustainable competitive advantage that protects market share and profitability over time','Short-term pricing power','A company\'s physical infrastructure'],correct:1,exp:'An economic moat (Buffett\'s term) refers to durable competitive advantages \u2014 brand, network effects, switching costs, cost advantages, or scale \u2014 that protect a company from competition.'},
    {q:'Return on equity (ROE) can be artificially inflated by:',choices:['Increasing net income only','Increasing debt (leverage), which reduces equity while potentially increasing net income','Issuing more common stock','Paying higher dividends'],correct:1,exp:'ROE = Net income / Equity. Heavy debt financing reduces equity (the denominator) and can boost ROE even without improving operations \u2014 this is why DuPont analysis isolates leverage as a separate ROE driver.'},
    {q:'The contribution margin ratio equals:',choices:['Gross profit / Revenue','(Revenue \u2212 Variable costs) / Revenue','Net income / Revenue','EBIT / Revenue'],correct:1,exp:'Contribution margin ratio = (Sales \u2212 Variable costs) / Sales. It represents the portion of each sales dollar that contributes to covering fixed costs and generating profit.'},
    {q:'Which of the following is a limitation of using EPS as a performance metric?',choices:['It is not reported on the income statement','It can be manipulated through share buybacks without any improvement in underlying business performance','It ignores revenue growth','It only applies to preferred shareholders'],correct:1,exp:'EPS = Net income / Shares outstanding. Buybacks reduce shares outstanding, mechanically boosting EPS even if net income is flat \u2014 masking underlying performance issues.'},
    {q:'In a leveraged recapitalization, a company typically:',choices:['Issues new equity to pay down debt','Takes on significant new debt to pay a large dividend or repurchase shares','Converts debt to equity','Sells assets to reduce leverage'],correct:1,exp:'A leveraged recap involves taking on new debt (increasing leverage) to return capital to shareholders via a large dividend or buyback \u2014 often used as a defense against hostile takeovers.'},
    {q:'The price-to-book (P/B) ratio compares:',choices:['Market price per share to earnings per share','Market price per share to book value per share (equity / shares outstanding)','Earnings per share to dividend per share','Enterprise value to EBITDA'],correct:1,exp:'P/B = Market price per share / Book value per share. A P/B > 1 means the market values the company above its net asset value, reflecting expected future returns on equity.'},
    {q:'Sensitivity analysis in financial modeling is used to:',choices:['Eliminate all model assumptions','Assess how changes in key assumptions (e.g., revenue growth, margins) affect the output (e.g., NPV)','Guarantee forecast accuracy','Replace scenario analysis'],correct:1,exp:'Sensitivity analysis tests one variable at a time to see how changes in key inputs affect model outputs \u2014 helping identify which assumptions drive value most significantly.'},
    {q:'A firm has EBIT of $500,000, interest expense of $100,000, and a 25% tax rate. Net income is:',choices:['$375,000','$300,000','$400,000','$500,000'],correct:1,exp:'EBIT $500,000 \u2212 Interest $100,000 = EBT $400,000 \u00d7 (1 \u2212 0.25) = $300,000 net income.'},
    {q:'The inventory turnover ratio (COGS / Average Inventory) measures:',choices:['Profitability of inventory','How many times inventory is sold and replaced in a period \u2014 efficiency of inventory management','Days inventory is held on the shelf','Inventory shrinkage rate'],correct:1,exp:'Inventory turnover = COGS / Average Inventory. A higher ratio signals efficient inventory management; a lower ratio may indicate overstocking or slow-moving goods.'},
    {q:'A company with a beta of 1.5 is expected to:',choices:['Move 1.5% for every 1% move in the risk-free rate','Move 1.5% for every 1% move in the overall market \u2014 50% more volatile than the market','Be less risky than the market','Have returns unrelated to market movements'],correct:1,exp:'Beta measures systematic (market) risk. A beta of 1.5 means the stock historically moves 1.5% for every 1% market move \u2014 more volatile than the overall market.'},
    {q:'Which of the following is a non-cash item added back to net income in the operating section of the indirect method cash flow statement?',choices:['Accounts receivable increase','Dividend payments','Depreciation and amortization','Repayment of debt'],correct:2,exp:'Depreciation and amortization reduce net income but involve no cash outflow. Under the indirect method, they are added back to reconcile net income to operating cash flow.'},
    {q:'The Weighted Average Cost of Capital (WACC) formula weights debt at:',choices:['Its book value','Its market value, using the after-tax cost of debt','Face value of bonds outstanding','Only short-term debt'],correct:1,exp:'WACC uses market values (not book values) for the debt and equity weights, and the after-tax cost of debt [Kd \u00d7 (1 \u2212 tax rate)] because interest is tax-deductible.'},
    {q:'A firm\'s net profit margin is 8% and asset turnover is 1.5. Using DuPont, ROA equals:',choices:['9.5%','12%','6%','18.75%'],correct:1,exp:'ROA = Net profit margin \u00d7 Asset turnover = 8% \u00d7 1.5 = 12%. The two-factor DuPont model breaks ROA into profitability (margin) and efficiency (turnover).'},
    {q:'In a merger using a stock-for-stock exchange, the acquirer\'s EPS will increase (accretion) if:',choices:['The target\'s P/E is higher than the acquirer\'s P/E','The acquirer\'s P/E is higher than the price paid (target\'s effective P/E)','The target has higher revenue than the acquirer','The deal is funded with cash instead'],correct:1,exp:'In a stock deal, accretion occurs when the acquirer\'s P/E (exchange ratio multiple) exceeds the effective P/E paid for the target \u2014 more earnings are added per share issued.'},
    {q:'Days payable outstanding (DPO) = (Accounts Payable / COGS) \u00d7 365. A very high DPO may indicate:',choices:['The company pays suppliers immediately','The company is stretching payment terms, possibly straining supplier relationships','Excellent liquidity management with no risk','The company has no current liabilities'],correct:1,exp:'A very high DPO suggests the company is taking a long time to pay suppliers. While it conserves cash, it may signal cash flow problems or damage supplier relationships and terms.'},
    {q:'Which valuation approach is most appropriate for a startup with no earnings or cash flow?',choices:['P/E multiple','DCF with positive terminal value only','Revenue multiples or comparable transaction analysis','Book value'],correct:2,exp:'For pre-profit startups, EV/Revenue multiples and comparable transaction/precedent deal analysis are commonly used since P/E and DCF require positive earnings or cash flows.'},
    {q:'Operating cash flow margin equals:',choices:['Net income / Revenue','Operating cash flow / Revenue','EBITDA / Operating income','Gross profit / Total assets'],correct:1,exp:'OCF margin = Operating cash flow / Revenue. It measures how much of each revenue dollar is converted to actual operating cash \u2014 often more reliable than net income margin.'},
    {q:'In bond valuation, when market interest rates rise, bond prices:',choices:['Rise proportionally','Fall \u2014 there is an inverse relationship between bond prices and interest rates','Stay the same if the bond is investment grade','Rise only for long-duration bonds'],correct:1,exp:'Bond prices move inversely to interest rates. When rates rise, the fixed coupon payments are worth less relative to new bonds being issued at higher rates, so prices fall.'},
    {q:'A company has current assets of $800,000 and current liabilities of $400,000. It collects $100,000 of accounts receivable in cash. The current ratio:',choices:['Increases','Decreases','Stays the same \u2014 both sides of the ratio are unaffected','Only changes if inventory is involved'],correct:2,exp:'Collecting AR converts one current asset (AR) to another (cash) \u2014 both current assets remain at $800,000. Current liabilities are unchanged. The current ratio stays the same.'},
    {q:'Monte Carlo simulation in financial analysis is used to:',choices:['Set a single deterministic forecast','Model the range of possible outcomes by running thousands of scenarios with random variable inputs','Eliminate forecasting uncertainty','Replace sensitivity analysis entirely'],correct:1,exp:'Monte Carlo simulation generates a probability distribution of outcomes by repeatedly sampling from input variable distributions (e.g., growth rates, margins) \u2014 providing a range of possible NPVs or values.'},
    {q:'The optimal capital structure theory suggests a firm should:',choices:['Use 100% debt financing','Balance debt and equity to minimize WACC and maximize firm value, considering the tax shield of debt against financial distress costs','Use 100% equity financing','Maintain equal proportions of debt and equity always'],correct:1,exp:'The trade-off theory of capital structure holds that firms balance the tax shield benefits of debt against increasing costs of financial distress as debt rises, optimizing to minimize WACC.'},
    {q:'Which financial ratio is most useful for evaluating a bank or financial institution\'s performance?',choices:['Debt-to-equity ratio','Return on assets (ROA) and net interest margin','Inventory turnover','Days sales outstanding'],correct:1,exp:'For banks, ROA (profitability relative to asset base) and net interest margin (NIM = net interest income / earning assets) are the most relevant performance metrics, given banks\' unique balance sheet structure.'},
  ],
  ISC: [
    {q:'The CIA triad in information security stands for:',choices:['Control, Integrity, Authentication','Confidentiality, Integrity, Availability','Compliance, Integration, Access','Certification, Identity, Authorization'],correct:1,exp:'CIA: Confidentiality (protect from unauthorized access), Integrity (ensure accuracy/completeness), Availability (ensure timely access).'},
    {q:'A SOC 1 report focuses on:',choices:['Customer data security posture','Internal controls relevant to user entities\' financial reporting','IT infrastructure performance metrics','Third-party vendor management'],correct:1,exp:'SOC 1 (SSAE 18) reports on internal controls relevant to the user entity\'s financial reporting.'},
    {q:'Which is a preventive control?',choices:['Audit trail logging','Exception reporting','Password complexity policy','Daily reconciliation reports'],correct:2,exp:'Password policies prevent unauthorized access (preventive). Audit trails and exception reports are detective controls.'},
    {q:'Encryption at rest protects data:',choices:['While transmitted over a network','Stored on disk, database, or other storage media','In active memory during processing','During backup transmission'],correct:1,exp:'Encryption at rest protects stored data; encryption in transit protects data moving across networks.'},
    {q:'Segregation of duties prevents:',choices:['System downtime','One person from initiating, authorizing, and recording the same transaction','Network security breaches','Database corruption'],correct:1,exp:'SoD ensures no single person can both authorize and record a transaction, reducing fraud and error risk.'},
    {q:'A general IT control differs from an application control because it:',choices:['Applies to one specific application only','Is performed manually','Applies across the overall IT environment supporting multiple applications','Requires end-user interaction'],correct:2,exp:'General IT controls (access management, change control, operations) apply across the IT environment. Application controls are specific to individual systems.'},
    {q:'Multi-factor authentication (MFA) requires:',choices:['Two different passwords','Something you know + something you have or are (two or more independent factors)','Biometrics only','PIN plus password (both knowledge factors)'],correct:1,exp:'MFA combines two or more factor types: knowledge (password), possession (token/phone), or inherence (biometric).'},
    {q:'A SQL injection attack exploits:',choices:['Weak network firewall configuration','Unsanitized user input fields in database-connected applications','Physical access to database servers','Social engineering of database administrators'],correct:1,exp:'SQL injection inserts malicious code through input fields, potentially allowing attackers to read, modify, or delete database content.'},
    {q:'Change management controls ensure that:',choices:['Users cannot change their own passwords','System changes are authorized, tested in non-production, and documented before deployment','Daily backups run without fail','Access logs are reviewed monthly'],correct:1,exp:'IT change management ensures all changes are properly authorized, tested, documented, and approved before going into production.'},
    {q:'A SOC 2 report evaluates controls related to:',choices:['Financial statement controls only','Security, availability, processing integrity, confidentiality, and/or privacy (Trust Service Criteria)','Physical facility security','Hardware and network performance'],correct:1,exp:'SOC 2 reports assess controls against the AICPA Trust Service Criteria: security, availability, processing integrity, confidentiality, privacy.'},
    {q:'RPO (Recovery Point Objective) defines:',choices:['How quickly systems must be restored after failure','The maximum acceptable amount of data loss, measured in time','The cost of the recovery process','The number of staff needed for recovery operations'],correct:1,exp:'RPO defines the maximum acceptable data loss measured in time (e.g., "we can tolerate losing up to 4 hours of data").'},
    {q:'An intrusion detection system (IDS) is classified as which type of control?',choices:['Preventive','Detective','Corrective','Compensating'],correct:1,exp:'An IDS detects and alerts on suspicious activity \u2014 it is a detective control, not preventive.'},
    {q:'Data masking is used to:',choices:['Encrypt data in transit between systems','Replace sensitive production data with realistic but fictitious data for non-production use','Create daily backups of production data','Monitor who accesses sensitive records'],correct:1,exp:'Data masking substitutes real sensitive data with realistic test data, allowing development/testing without exposing production data.'},
    {q:'The purpose of a disaster recovery plan (DRP) is to:',choices:['Prevent all system failures from occurring','Restore IT operations and systems to a functional state after a disruption','Train users on new applications','Ensure SOX compliance'],correct:1,exp:'A DRP outlines the steps to restore IT systems, applications, and data after a disaster or significant disruption.'},
    {q:'RTO (Recovery Time Objective) defines:',choices:['Maximum acceptable data loss','The maximum tolerable downtime \u2014 how quickly systems must be restored','Cost to restore systems','Data backup frequency'],correct:1,exp:'RTO is the maximum acceptable time to restore systems after a failure. RPO covers data loss; RTO covers downtime.'},
    {q:'A phishing attack primarily targets:',choices:['Network infrastructure vulnerabilities','Human users through deceptive messages to steal credentials','Database servers directly','Physical security perimeters'],correct:1,exp:'Phishing exploits human psychology by tricking users into revealing credentials or installing malware via deceptive emails/messages.'},
    {q:'A business continuity plan (BCP) differs from a DRP in that a BCP:',choices:['Focuses only on IT systems','Addresses the continuation of ALL critical business functions, not just IT','Is required only by public companies','Covers only natural disaster scenarios'],correct:1,exp:'A BCP covers all critical business processes (people, facilities, suppliers, communications), while a DRP focuses specifically on IT system recovery.'},
    {q:'Which is a characteristic of a hot site in disaster recovery?',choices:['An empty facility with power and connectivity only','A facility with some equipment but no current data','A fully equipped, live-data backup facility that can be activated immediately','A mobile data center on a truck'],correct:2,exp:'A hot site is a fully operational backup facility with mirrored data that can take over operations almost immediately. Cold sites have space/utilities; warm sites have some equipment.'},
    {q:'COBIT (Control Objectives for Information and Related Technologies) is primarily a framework for:',choices:['Network security protocols','IT governance and management of enterprise IT','Software development methodologies','Cloud infrastructure management'],correct:1,exp:'COBIT is a framework created by ISACA for IT governance, enabling organizations to align IT strategy with business goals and manage IT risks and resources.'},
    {q:'A key control for preventing unauthorized access to a database would be:',choices:['Daily backup procedures','Role-based access control (RBAC) limiting access by job function','Antivirus software on workstations','Regular server hardware maintenance'],correct:1,exp:'Role-based access control (RBAC) restricts database access based on defined job roles, ensuring employees can only access data necessary for their function.'},
    {q:'Penetration testing (pen testing) is a security practice that:',choices:['Monitors network traffic in real time','Simulates cyberattacks to identify and exploit vulnerabilities before attackers do','Updates software patches across all systems','Trains employees to identify phishing attempts'],correct:1,exp:'Pen testing involves authorized simulated attacks to discover and exploit security vulnerabilities before malicious actors can.'},
    {q:'Which of the following BEST describes a zero-day exploit?',choices:['An attack using outdated malware','A vulnerability that is unknown to the software vendor and has no patch available','A denial-of-service attack','An attack occurring on the first day of system deployment'],correct:1,exp:'A zero-day exploit targets a vulnerability that is unknown to the vendor (zero days of patch availability), making it especially dangerous.'},
    {q:'Under NIST\'s Cybersecurity Framework, the five core functions are:',choices:['Plan, Test, Deploy, Monitor, Respond','Identify, Protect, Detect, Respond, Recover','Assess, Plan, Implement, Review, Report','Audit, Control, Monitor, Remediate, Document'],correct:1,exp:'The NIST CSF\'s five functions: Identify (understand risks), Protect (implement safeguards), Detect (identify events), Respond (act on incidents), Recover (restore capabilities).'},
    {q:'The concept of "least privilege" in access control means:',choices:['All users get the same minimum level of access','Users are granted only the permissions necessary to perform their job functions','Admin accounts are shared to minimize user counts','Access is granted only during business hours'],correct:1,exp:'Least privilege: users get the minimum access rights needed to perform their duties, reducing the attack surface and limiting damage from compromised accounts.'},
    {q:'Data integrity controls ensure that:',choices:['Data is confidential and encrypted','Data is accurate, complete, and has not been altered without authorization','Data is available 24/7','Data is backed up hourly'],correct:1,exp:'Data integrity controls detect and prevent unauthorized modification of data, ensuring it remains accurate and complete throughout its lifecycle.'},
    {q:'An audit log (audit trail) is an example of which type of control?',choices:['Preventive','Detective','Corrective','Directive'],correct:1,exp:'Audit logs are detective controls \u2014 they record events so that unauthorized activity can be identified and investigated after the fact.'},
    {q:'Tokenization replaces sensitive data (e.g., credit card numbers) with:',choices:['Encrypted versions of the original data','A non-sensitive placeholder (token) with no exploitable mathematical relationship to the original','A hash of the original data','Compressed data'],correct:1,exp:'Tokenization substitutes sensitive data with a random, non-sensitive token stored in a token vault. Unlike encryption, tokens have no mathematical relationship to the original data.'},
    {q:'The COSO Internal Control framework\'s five components are:',choices:['Plan, Act, Check, Do, Review','Control Environment, Risk Assessment, Control Activities, Information & Communication, Monitoring','Identify, Assess, Control, Monitor, Improve','Governance, Risk, Compliance, Audit, Technology'],correct:1,exp:'COSO 2013: Control Environment, Risk Assessment, Control Activities, Information & Communication, and Monitoring Activities.'},
    {q:'Which type of malware encrypts a victim\'s files and demands payment for decryption?',choices:['Spyware','Ransomware','Adware','Trojan horse'],correct:1,exp:'Ransomware encrypts files or locks systems, demanding ransom (usually cryptocurrency) for decryption keys. It\'s one of the most prevalent cyber threats today.'},
    {q:'The primary risk addressed by a data loss prevention (DLP) solution is:',choices:['Malware infiltration','Unauthorized transfer or exfiltration of sensitive data outside the organization','System availability during attacks','Credential theft'],correct:1,exp:'DLP solutions monitor, detect, and block the unauthorized transfer or exfiltration of sensitive data, protecting against insider threats and accidental data leakage.'},
    {q:'Which of the following is an example of a corrective control?',choices:['User access review','Firewall rules blocking unauthorized traffic','Restoring data from backup after a ransomware attack','Audit log monitoring'],correct:2,exp:'Corrective controls fix problems after they occur. Restoring from backup corrects the damage caused by ransomware. Firewalls are preventive; audit logs are detective.'},
    {q:'The principle of "defense in depth" in cybersecurity means:',choices:['Using the strongest single security control possible','Implementing multiple, layered security controls so that if one fails, others still protect the system','Relying solely on perimeter security (firewalls)','Encrypting all data at rest and in transit'],correct:1,exp:'Defense in depth uses multiple security layers (physical, network, application, data) so that compromise of one layer does not result in total system compromise.'},
    {q:'A Type 2 SOC report differs from a Type 1 in that it:',choices:['Only tests design effectiveness','Tests both the design AND operating effectiveness of controls over a period of time (typically 6-12 months)','Covers only financial reporting controls','Is performed by the client, not an auditor'],correct:1,exp:'SOC Type 1 reports on control design at a point in time. Type 2 tests whether controls operated effectively over a specified period — providing much stronger assurance.'},
    {q:'Access provisioning controls are designed to ensure that:',choices:['All users share one login','New user access rights are granted based on job role and approved by an authorized manager','Passwords are changed quarterly','Systems are available 24/7'],correct:1,exp:'Access provisioning ensures new employees (or role changes) receive only the access appropriate for their position, with proper authorization — supporting least privilege and segregation of duties.'},
    {q:'Which of the following best describes a "man-in-the-middle" (MitM) attack?',choices:['An attacker physically accessing a server room','An attacker secretly intercepts and potentially alters communications between two parties who believe they are communicating directly','A brute-force attack on a password','An insider threat exploiting privileged access'],correct:1,exp:'In a MitM attack, the attacker positions themselves between two communicating parties (e.g., user and bank website), intercepting, reading, and potentially modifying traffic without detection.'},
    {q:'IT general controls (ITGCs) are important because they:',choices:['Replace the need for application controls','Provide the foundation for the reliability of application controls — if ITGCs are weak, all application controls running on those systems are suspect','Only apply to hardware security','Are only required for public companies'],correct:1,exp:'ITGCs (access management, change management, operations, backups) establish the control environment in which application controls operate. Weak ITGCs undermine the reliability of all dependent application controls.'},
    {q:'Data classification policies establish:',choices:['How long employees can access systems','Categories of data sensitivity (e.g., public, internal, confidential, restricted) and required security controls for each','The vendor selection process','Network architecture standards'],correct:1,exp:'Data classification assigns sensitivity levels to data, defining how each category must be handled, stored, transmitted, and disposed of — enabling proportionate security controls based on risk.'},
    {q:'Which of the following is the best description of a vulnerability assessment?',choices:['A simulated attack that actively exploits weaknesses','A systematic review that identifies and classifies security vulnerabilities in a system, without exploiting them','A review of physical security controls only','An employee awareness survey'],correct:1,exp:'A vulnerability assessment identifies and ranks security weaknesses (CVEs, misconfigurations, etc.) without actively exploiting them — unlike penetration testing, which simulates actual exploitation.'},
    {q:'An organization\'s "acceptable use policy" (AUP) primarily governs:',choices:['Third-party vendor security requirements','How employees and users are permitted to use organizational IT resources and what constitutes prohibited use','Password complexity requirements','System backup frequency'],correct:1,exp:'An AUP defines permitted and prohibited uses of organizational technology (systems, email, internet) by employees, contractors, and other users — a foundational security governance document.'},
    {q:'Input validation controls in an application are designed to:',choices:['Ensure outputs are accurate','Prevent invalid, malformed, or malicious data from being accepted and processed by the system','Monitor user login times','Back up transaction data'],correct:1,exp:'Input validation rejects data that does not conform to expected formats, types, or ranges — preventing errors, data corruption, and injection attacks (SQL injection, XSS) at the entry point.'},
    {q:'The ITIL framework is primarily concerned with:',choices:['Software development lifecycle','IT service management — delivering and supporting IT services aligned to business needs','Network security standards','Cloud computing governance'],correct:1,exp:'ITIL (IT Infrastructure Library) is a widely adopted framework for IT service management (ITSM), covering service strategy, design, transition, operation, and continuous improvement.'},
    {q:'Biometric authentication is categorized as which factor type?',choices:['Something you know','Something you have','Something you are','Something you do'],correct:2,exp:'Biometrics (fingerprints, facial recognition, iris scans, voice) are "something you are" — inherence factors. Knowledge factors: passwords/PINs. Possession factors: tokens/smart cards.'},
    {q:'Which IT control framework is most focused on risk management and cybersecurity for critical infrastructure?',choices:['ITIL','COBIT','NIST Cybersecurity Framework (CSF)','ISO 9001'],correct:2,exp:'The NIST CSF (Identify, Protect, Detect, Respond, Recover) was developed to help organizations manage cybersecurity risk, particularly for critical infrastructure, and is widely used across industries.'},
    {q:'An application control that ensures every sales order has a corresponding customer record before processing is an example of a:',choices:['Output control','Completeness check','Referential integrity / validity check','Batch total control'],correct:2,exp:'A validity (or referential integrity) check verifies that input data references valid, existing records (e.g., a customer number that exists in the customer master file) before allowing a transaction to proceed.'},
    {q:'A rainbow table attack is used to:',choices:['Decrypt SSL/TLS traffic','Crack password hashes by pre-computing hash values for common passwords and comparing them to stolen hashes','Exploit buffer overflow vulnerabilities','Intercept network traffic'],correct:1,exp:'Rainbow tables are precomputed tables of hash values used to reverse-engineer (crack) password hashes. Salting passwords (adding random data before hashing) defeats rainbow table attacks.'},
    {q:'In IT audit, "evidence of control operation" means:',choices:['The auditor designed the control','There is documentation or proof that the control actually executed as intended during the period','Management represented the control is effective','The control is designed properly on paper'],correct:1,exp:'Evidence of control operation (e.g., approvals, logs, timestamps) proves the control actually ran during the audit period — required for a Type 2 SOC or ICFR assessment beyond design evaluation.'},
    {q:'Which of the following BEST describes the purpose of encryption in data security?',choices:['Prevents all unauthorized access','Renders data unreadable to anyone without the proper decryption key, protecting confidentiality even if data is intercepted or stolen','Backs up data automatically','Ensures data availability'],correct:1,exp:'Encryption protects confidentiality by transforming plaintext into ciphertext, making data unreadable without the correct key — even if attackers intercept or steal the data.'},
    {q:'A "cold site" in disaster recovery is:',choices:['A fully operational backup data center with live data mirroring','A facility with basic infrastructure (space, power, cooling) but no pre-installed equipment or data — requires the most time to activate','A mobile recovery unit','A cloud-based backup solution'],correct:1,exp:'Cold sites provide physical space and utilities (power, HVAC, connectivity) but have no pre-configured equipment. They take the longest to activate but are the cheapest option.'},
    {q:'Under GDPR and similar data privacy regulations, "data minimization" means:',choices:['Encrypting all personal data','Collecting only the personal data that is necessary for the specified purpose — no excess collection','Deleting all data after 30 days','Sharing data only with domestic entities'],correct:1,exp:'Data minimization is a core privacy principle: organizations should collect only the minimum personal data necessary for the stated processing purpose, reducing privacy risk exposure.'},
    {q:'Which of the following is a key risk in cloud computing environments?',choices:['Inability to scale resources','Loss of direct physical control over infrastructure and data, potentially affecting security, compliance, and data sovereignty','High capital expenditure for hardware','Reduced processing speed'],correct:1,exp:'Key cloud risks include: loss of physical control, multi-tenancy (shared infrastructure), data sovereignty concerns (data location), vendor lock-in, and dependency on the provider\'s security controls.'},
    {q:'Privileged access management (PAM) solutions are implemented to:',choices:['Improve employee productivity','Control, monitor, and audit the use of privileged accounts (admin, root, service accounts) to prevent abuse and detect threats','Replace two-factor authentication','Manage software licenses'],correct:1,exp:'PAM tools manage privileged credentials, enforce least privilege, require approval workflows for sensitive access, and record privileged sessions — critical for preventing insider threats and APT lateral movement.'},
    {q:'A "denial of service" (DoS) attack primarily targets which security objective?',choices:['Confidentiality','Integrity','Availability','Non-repudiation'],correct:2,exp:'DoS/DDoS attacks overwhelm systems with traffic or requests, making services unavailable to legitimate users — directly attacking the Availability pillar of the CIA triad.'},
    {q:'Continuous monitoring in an IT environment is designed to:',choices:['Replace annual audits entirely','Provide ongoing, real-time visibility into the security and compliance posture of systems, enabling faster detection and response','Eliminate the need for access controls','Guarantee zero incidents'],correct:1,exp:'Continuous monitoring uses automated tools (SIEM, log analysis, vulnerability scanners) to provide ongoing detection of anomalies, policy violations, and security events — reducing detection time versus periodic reviews.'},
    {q:'Which of the following is an application-level control rather than a general IT control?',choices:['Logical access management for all IT systems','Automated three-way match in accounts payable (PO, receipt, invoice)','Change management procedures for all production systems','Daily backup and recovery procedures'],correct:1,exp:'Application controls are embedded within specific applications (e.g., automated three-way match in AP software). General IT controls apply broadly across all systems and applications.'},
    {q:'ISO/IEC 27001 is an international standard for:',choices:['Software development quality management','Information security management systems (ISMS) — specifying requirements for establishing, implementing, and maintaining an ISMS','Network performance benchmarking','Cloud service level agreements'],correct:1,exp:'ISO 27001 specifies requirements for implementing an Information Security Management System (ISMS), providing a systematic approach to managing sensitive information and achieving certification.'},
    {q:'Which of the following describes a "social engineering" attack?',choices:['Exploiting a software vulnerability in an operating system','Manipulating people through deception to reveal confidential information or take actions that compromise security','Intercepting network packets','Installing malware via a USB drive'],correct:1,exp:'Social engineering exploits human psychology rather than technical vulnerabilities — using deception, pretexting, phishing, vishing, or impersonation to bypass security controls.'},
    {q:'An entity\'s incident response plan should include which of the following phases?',choices:['Only detection and containment','Preparation, detection/analysis, containment, eradication, recovery, and post-incident review (lessons learned)','Detection and reporting to law enforcement only','Eradication and recovery only'],correct:1,exp:'A comprehensive incident response plan follows the NIST 800-61 lifecycle: Preparation → Detection & Analysis → Containment, Eradication & Recovery → Post-Incident Activity (lessons learned).'},
    {q:'Which type of software testing ensures that a new code change did not break existing functionality?',choices:['Unit testing','Integration testing','Regression testing','User acceptance testing (UAT)'],correct:2,exp:'Regression testing re-runs previously passing tests after code changes to verify that existing functionality still works correctly — critical in change management before deploying to production.'},
    {q:'The AICPA\'s Trust Service Criteria (TSC) for SOC 2 reports identifies "processing integrity" as:',choices:['Ensuring data is encrypted at all times','System processing that is complete, valid, accurate, timely, and authorized','Ensuring systems are available 99.9% of the time','Protecting personal data from disclosure'],correct:1,exp:'Processing integrity (one of the five TSC) addresses whether system processing is complete, valid, accurate, timely, and authorized — ensuring transactions are processed as intended with no errors or omissions.'},
    {q:'When evaluating IT controls in a financial audit, the auditor is primarily concerned with controls that affect:',choices:['Network speed and uptime','The completeness, accuracy, and validity of financial data generated by IT systems','The number of IT staff','Software licensing compliance'],correct:1,exp:'Financial auditors focus on IT controls that affect the reliability of financial data — completeness (all transactions captured), accuracy (correctly processed), and validity (only authorized transactions) of the financial reporting process.'},
  ],
}

// ── Quiz engine state ──
let _quiz = {
  active: false,
  section: null,
  type: null,
  questions: [],
  current: 0,
  selected: null,
  answered: false,
  score: 0,
  timerInterval: null,
  timeLeft: 0,
  results: [],
};

// ── AI QUESTION GENERATION (Step 6) ───────────────────────────────────────────
// Free: none (upgrade gate). Pro: 20 fresh MCQs per section per 24h + topic focus.
// Paid: unlimited. Generated sets feed the existing quiz engine and are cached
// per-user in S.aiQbCache so retries/repeats cost nothing.
const AI_QB_PRO_DAILY = 20;
const AI_QB_SET_SIZE  = 10;
let _lastAIQuiz = null;     // {section,questions,topic} — for free retry
let _aiQbGenerating = false;

function _aiQbToday(){ return _ymd(new Date()); }
function _aiQbQuota(section){
  if(isElite()) return {unlimited:true, used:0, limit:Infinity, remaining:Infinity};
  if(!isPro())  return {locked:true, used:0, limit:0, remaining:0};
  S.aiQbUsage = S.aiQbUsage || {};
  let u = S.aiQbUsage[section];
  const today = _aiQbToday();
  if(!u || u.date !== today){ u = {date:today, count:0}; S.aiQbUsage[section] = u; }
  const used = u.count || 0;
  return {used, limit:AI_QB_PRO_DAILY, remaining:Math.max(0, AI_QB_PRO_DAILY - used)};
}
function _aiQbConsume(section, n){
  if(isElite()) return; // unlimited
  S.aiQbUsage = S.aiQbUsage || {};
  const today = _aiQbToday();
  let u = S.aiQbUsage[section];
  if(!u || u.date !== today) u = {date:today, count:0};
  u.count = (u.count || 0) + n;
  S.aiQbUsage[section] = u;
  saveState();
}

function _aiQbPrompt(code, full, topic, count){
  return 'Generate exactly ' + count + ' multiple-choice questions for the CPA exam section ' + code + ' (' + full + ').'
    + (topic ? (' Focus specifically on this topic: ' + topic + '.') : '')
    + ' Each question must be exam-realistic and test real conceptual understanding or a calculation, with exactly 4 answer choices and one unambiguously correct answer.'
    + ' Return ONLY a JSON array (no prose, no markdown fences). Each element is an object with keys:'
    + ' "q" (question text), "choices" (array of exactly 4 strings), "correct" (integer 0-3 index of the correct choice), "exp" (a concise 1-2 sentence explanation, citing the relevant standard/rule when applicable).'
    + ' Vary difficulty and subtopics. Do not number the questions. Do not repeat questions.';
}

function _normAIQ(o){
  if(!o || typeof o !== 'object') return null;
  const q = (o.q || o.question || '').toString().trim();
  let choices = o.choices || o.options || o.answers;
  if(!Array.isArray(choices) || choices.length < 4) return null;
  choices = choices.slice(0,4).map(c => (c==null?'':c).toString());
  let correct = o.correct;
  if(typeof correct === 'string'){
    const L = 'ABCD'.indexOf(correct.trim().toUpperCase());
    correct = L >= 0 ? L : choices.findIndex(c => c === correct);
  }
  correct = parseInt(correct, 10);
  if(!(correct >= 0 && correct <= 3)) return null;
  if(q.length < 8) return null;
  const exp = (o.exp || o.explanation || '').toString().trim() || 'Review this concept with your primary course.';
  return {q, choices, correct, exp};
}

async function generateAIQuestions(section, topic){
  topic = (topic || '').trim();
  const sec = QB_SECTIONS.find(s => s.code === section);
  if(!sec) return;
  if(!isPro()){ openUpgradeModal('AI Question Generator'); return; }
  if(_aiQbGenerating) return;

  let count = AI_QB_SET_SIZE;
  const quota = _aiQbQuota(section);
  if(!quota.unlimited){
    if(quota.remaining <= 0){
      showToast("You've used today's " + AI_QB_PRO_DAILY + " AI questions for " + section + ". Resets in 24h.", 'info');
      return;
    }
    count = Math.min(count, quota.remaining);
  }

  _aiQbGenerating = true;
  closeQBSection();
  _showAIQbLoading(section, topic);
  try{
    const raw = await _fcCallAI(_aiQbPrompt(section, sec.full, topic, count), Math.min(4096, count*280 + 500));
    let arr = (_fcParseJSON(raw) || []).map(_normAIQ).filter(Boolean).map(_fcShuffleChoices).slice(0, count);
    if(!arr.length) throw new Error('no valid questions');

    _aiQbConsume(section, arr.length);
    // Cache per-user so the same questions can re-serve for free.
    S.aiQbCache = S.aiQbCache || {};
    const bank = S.aiQbCache[section] = S.aiQbCache[section] || [];
    const seen = new Set(bank.map(x => x.q));
    arr.forEach(x => { if(!seen.has(x.q)){ bank.push(x); seen.add(x.q); } });
    if(bank.length > 300) S.aiQbCache[section] = bank.slice(-300);
    saveState();

    _launchAIQuiz(section, arr, topic);
  }catch(e){
    console.warn('[Ledger] AI question gen failed:', e.message);
    showToast(window._aiHealthy === false ? 'AI is temporarily offline — try again shortly' : 'Could not generate questions — try again', 'err');
    closeQuizOverlay();
  }finally{
    _aiQbGenerating = false;
  }
}

function _showAIQbLoading(section, topic){
  let overlay = document.getElementById('quiz-overlay');
  if(!overlay){ overlay = document.createElement('div'); overlay.id = 'quiz-overlay'; overlay.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:700;overflow-y:auto;animation:fadeIn .2s ease'; document.body.appendChild(overlay); }
  overlay.style.display = 'block';
  const safeTopic = (topic||'').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  overlay.innerHTML = '<div style="max-width:520px;margin:90px auto;text-align:center;padding:0 20px">'
    + '<div style="margin-bottom:18px">'+LedgerBuddy('think',120)+'</div>'
    + '<div style="font-size:22px;font-weight:900;letter-spacing:-.03em;margin-bottom:10px">Writing fresh ' + section + ' questions…</div>'
    + '<div style="font-size:13px;color:var(--sub);line-height:1.6">' + (safeTopic ? ('Topic: ' + safeTopic) : 'Building a brand-new practice set just for you') + '</div>'
    + '</div>';
}

function _launchAIQuiz(section, questions, topic){
  _lastAIQuiz = {section, questions: questions.slice(), topic: topic || ''};
  _quiz = {active:true, section, type:'ai', questions: questions.slice(), current:0, selected:null, answered:false, score:0, timerInterval:null, timeLeft:0, results:[]};
  let overlay = document.getElementById('quiz-overlay');
  if(!overlay){ overlay = document.createElement('div'); overlay.id = 'quiz-overlay'; overlay.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:700;overflow-y:auto;animation:fadeIn .2s ease'; document.body.appendChild(overlay); }
  overlay.style.display = 'block';
  _renderQuiz();
}

// ── QUESTION BANK — two sources, merged ─────────────────────────────────────
// 1. /qbank/{SECTION}.json: questions that ship with the app (built from
//    qbank/src by scripts/build-qbank.js).
// 2. Firestore questionBank/{SECTION}/topics: questions added by /api/generate-bank.
// Both are plain reads with no AI cost, cached for the session.
let _qbBankCache = {}; // section -> {questions:[...], loadedAt}
function _qbKey(q){ return String(q||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }

// ── PER-QUESTION HISTORY ────────────────────────────────────────────────────
// S.qbHist[section][id] = 1 if the last attempt was right, 0 if it was wrong.
// The id is a short hash of the question text, so history survives reshuffles
// and stays small enough for the synced state document (~10 bytes a question).
function _qbId(q){
  const k = _qbKey(q && q.q);
  let h = 0x811c9dc5;
  for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36);
}
function _qbHist(section){
  S.qbHist = S.qbHist || {};
  return S.qbHist[section] = S.qbHist[section] || {};
}
// Seen / missed counts, measured against the bank when it's loaded.
function _qbHistStats(section, bank){
  const h = (S.qbHist || {})[section] || {};
  if (!bank || !bank.length) {
    const v = Object.keys(h).map(function(k){ return h[k]; });
    return {seen: v.length, missed: v.filter(function(x){ return x === 0; }).length, total: 0};
  }
  let seen = 0, missed = 0;
  bank.forEach(function(q){ const v = h[_qbId(q)]; if (v !== undefined) { seen++; if (v === 0) missed++; } });
  return {seen, missed, total: bank.length};
}
async function _qbStatic(section){
  try{
    const r=await fetch('/qbank/'+section+'.json');
    if(!r.ok) return [];
    const d=await r.json();
    let out=[];
    (d.topics||[]).forEach(t=>{ (t.questions||[]).forEach(x=>out.push(Object.assign({topic:t.topic},x))); });
    return out;
  }catch(e){ return []; }
}
async function _qbFirestore(section){
  if(!firebaseDb) return [];
  try{
    const snap=await firebaseDb.collection('questionBank').doc(section).collection('topics').get();
    let out=[];
    snap.forEach(d=>{ const dd=d.data()||{}; if(Array.isArray(dd.questions)) out=out.concat(dd.questions); });
    return out;
  }catch(e){ console.warn('[Ledger] question bank load failed:',e.message); return []; }
}
async function loadQuestionBank(section){
  const cached=_qbBankCache[section];
  if(cached && cached.questions) return cached.questions;
  const [db, shipped]=await Promise.all([_qbFirestore(section), _qbStatic(section)]);
  const seen=new Set(), questions=[];
  db.concat(shipped).forEach(x=>{ const k=_qbKey(x.q); if(k && !seen.has(k)){ seen.add(k); questions.push(x); } });
  _qbBankCache[section]={questions,loadedAt:Date.now()};
  return questions;
}
function _showQuizLoading(section){
  let overlay=document.getElementById('quiz-overlay');
  if(!overlay){ overlay=document.createElement('div'); overlay.id='quiz-overlay'; overlay.style.cssText='position:fixed;inset:0;background:var(--bg);z-index:700;overflow-y:auto;animation:fadeIn .2s ease'; document.body.appendChild(overlay); }
  overlay.style.display='block';
  overlay.innerHTML='<div style="max-width:520px;margin:100px auto;text-align:center;padding:0 20px"><div style="margin-bottom:16px">'+LedgerBuddy('think',120)+'</div><div style="font-size:20px;font-weight:900;letter-spacing:-.03em">Loading your '+section+' question bank…</div></div>';
}

async function openQuizModal(section, type, topic, count, timed) {
  // AI custom sets aren't in the bank — replay the last generated set (free), or generate anew.
  if (type === 'ai') {
    if (_lastAIQuiz && _lastAIQuiz.section === section && _lastAIQuiz.questions.length) {
      _launchAIQuiz(section, _lastAIQuiz.questions, _lastAIQuiz.topic);
    } else {
      generateAIQuestions(section, '');
    }
    return;
  }
  if (!isPro() && type !== 'mcq' && type !== 'missed') { openUpgradeModal('Question Bank — ' + type); return; }

  // Primary source = the pre-generated bank (random, curated, free to serve).
  // Falls back to the built-in static set until the bank is populated.
  let bank = (_qbBankCache[section] || {}).questions;
  if (bank === undefined) { _showQuizLoading(section); bank = await loadQuestionBank(section); }
  const pool = (bank && bank.length) ? bank : (QB_QUESTIONS[section] || []);
  const hist = _qbHist(section);
  let pick = topic ? pool.filter(function(q){ return q.topic === topic; }) : pool;
  if (type === 'missed') pick = pick.filter(function(q){ return hist[_qbId(q)] === 0; });
  if (type === 'missed' && !pick.length) { closeQuizOverlay(); showToast("No missed " + section + " questions right now. Nice work!", 'success'); return; }
  if (topic && !pick.length) { closeQuizOverlay(); showToast('No questions found for that topic yet', 'info'); return; }
  if (!pool.length) { closeQuizOverlay(); showToast('Questions coming soon for ' + section, 'info'); return; }

  const elite = isElite(), pro = isPro();
  // Per-attempt size by type, then capped by tier: Free taster / paid unlimited.
  const custom = type === 'custom' ? Math.max(1, Math.floor(Number(count)) || 20) : 0;
  const isTimed = type === 'timed' || (!!custom && !!timed);
  const want = custom || (type === 'timed' ? 10 : type === 'random' ? (elite ? 50 : 20) : 20);
  let cap;
  if (!pro) cap = 5;
  else if (elite) cap = Math.min(want, pick.length);
  else {
    const rem = _aiQbQuota(section).remaining;
    if (rem <= 0) { closeQuizOverlay(); showToast("You've used today's " + AI_QB_PRO_DAILY + " " + section + " questions — resets in 24h.", 'info'); return; }
    cap = Math.min(want, rem);
  }

  // Fisher–Yates shuffle (sort-by-random is biased).
  const shuffled = pick.slice();
  for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = shuffled[i]; shuffled[i] = shuffled[j]; shuffled[j] = t; }
  // Questions never answered come first; once those run out, repeats follow.
  const ordered = type === 'missed' ? shuffled
    : shuffled.filter(function(q){ return hist[_qbId(q)] === undefined; })
        .concat(shuffled.filter(function(q){ return hist[_qbId(q)] !== undefined; }));
  const qs = ordered.slice(0, Math.max(1, Math.min(cap, pick.length)));
  if (pro && !elite) _aiQbConsume(section, qs.length); // bank reads are free, but Pro is metered to 20/section/day
  if (custom && qs.length < custom) showToast('Starting with ' + qs.length + ' questions, the most available right now', 'info');

  _quiz = {
    active: true, finished: false, section, type, topic: topic || null, count: custom || null, timed: isTimed,
    questions: qs, current: 0,
    selected: null, answered: false,
    score: 0, timerInterval: null,
    timeLeft: isTimed ? qs.length * 60 : 0,
    results: [],
  };

  let overlay = document.getElementById('quiz-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'quiz-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:var(--bg);z-index:700;overflow-y:auto;animation:fadeIn .2s ease';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'block';
  _renderQuiz();

  if (isTimed) {
    _quiz.timerInterval = setInterval(function() {
      _quiz.timeLeft--;
      const el = document.getElementById('quiz-timer');
      if (el) {
        el.textContent = _fmtQuizTime(_quiz.timeLeft);
        el.style.color = _quiz.timeLeft < 60 ? 'var(--red)' : _quiz.timeLeft < 180 ? 'var(--amb)' : 'var(--grn)';
      }
      if (_quiz.timeLeft <= 0) { clearInterval(_quiz.timerInterval); _finishQuiz(); }
    }, 1000);
  }
}

function closeQuizOverlay() {
  if (_quiz.timerInterval) clearInterval(_quiz.timerInterval);
  if (_quiz.histDirty) { _quiz.histDirty = false; saveState(); }
  _quiz.active = false;
  const overlay = document.getElementById('quiz-overlay');
  if (overlay) overlay.style.display = 'none';
}

// Section colour as custom properties for the .qb-*/.qz-* styles.
function _qbVars(code){
  const c=_sectionColor(code);
  return '--c:'+c+';--ct:'+_sectionText(code)+';--cb:'+c+'1f';
}
// m:ss, or h:mm:ss once a long custom timed quiz passes an hour.
function _fmtQuizTime(t) {
  t = Math.max(0, t | 0);
  const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sec = String(t % 60).padStart(2, '0');
  return h ? h + ':' + String(m).padStart(2, '0') + ':' + sec : m + ':' + sec;
}
function _qbTypeLabel(type, topic, timed){
  if (type === 'custom' && timed) return 'Custom timed quiz';
  return topic || ({mcq:'Practice set', timed:'Timed set', random:'Random quiz', custom:'Custom quiz', missed:'Missed questions', ai:'AI practice', topic:'Topic drill'})[type] || 'Practice';
}

function _renderQuiz() {
  const overlay = document.getElementById('quiz-overlay');
  if (!overlay) return;
  const { section, type, questions, current, selected, answered, timeLeft, timed } = _quiz;
  const q = questions[current];
  const total = questions.length;
  const L = ['A','B','C','D'];
  const pct = total > 0 ? Math.round((current + (answered ? 1 : 0)) / total * 100) : 0;

  const timerHTML = timed
    ? '<div class="qz-timer">' + ico('timer') + '<span id="quiz-timer" style="color:' + (timeLeft < 60 ? 'var(--red)' : timeLeft < 180 ? 'var(--amb)' : 'var(--grn)') + '">' + _fmtQuizTime(timeLeft) + '</span></div>'
    : '';

  const opts = q.choices.map(function(c, i) {
    let cls = 'qz-opt';
    if (answered) {
      if (i === q.correct) cls += ' ok';
      else if (i === selected) cls += ' bad';
      else cls += ' dim';
    } else if (i === selected) cls += ' sel';
    const mark = answered && i === q.correct ? ico('check') : answered && i === selected ? ico('x') : L[i];
    return '<button type="button" class="' + cls + '" ' + (answered ? 'disabled' : 'onclick="_selectAnswer(' + i + ')"') + ' aria-pressed="' + (i === selected) + '">' +
      '<span class="qz-l">' + mark + '</span><span class="qz-opt-t">' + esc(c) + '</span></button>';
  }).join('');

  let feedback = '';
  if (answered) {
    const right = selected === q.correct;
    feedback =
      '<div class="qz-fb" style="color:' + (right ? 'var(--grn)' : 'var(--red)') + '">' +
        '<i style="background:' + (right ? 'var(--grn)' : 'var(--red)') + '">' + ico(right ? 'check' : 'x') + '</i>' +
        (right ? 'Correct' : 'Not quite. The answer is ' + L[q.correct] + '.') +
      '</div>' +
      '<div class="qz-exp">' + esc(q.exp) + '</div>';
  }

  const last = current >= total - 1;
  const btn = answered
    ? '<button class="qz-btn" onclick="' + (last ? '_finishQuiz()' : '_nextQuestion()') + '">' + (last ? 'See results' : 'Next question') + '</button>'
    : '<button class="qz-btn" onclick="_submitAnswer()" ' + (selected === null ? 'disabled' : '') + '>Check answer</button>';

  overlay.innerHTML =
    '<div class="qz" style="' + _qbVars(section) + '">' +
      '<div class="qz-top">' +
        '<button class="qb-x" onclick="closeQuizOverlay()" aria-label="Close">' + ico('x') + '</button>' +
        '<span class="qb-chip">' + section + '</span>' +
        '<span class="qz-mode">' + esc(_qbTypeLabel(type, _quiz.topic, _quiz.timed)) + '</span>' +
        timerHTML +
        '<span class="qz-count">' + (current + 1) + ' / ' + total + '</span>' +
      '</div>' +
      '<div class="qb-bar" style="height:4px"><i style="width:' + pct + '%"></i></div>' +
      '<div class="qz-card">' +
        '<div class="qz-eyebrow">Question ' + (current + 1) + (q.topic ? ' <span>· ' + esc(q.topic) + '</span>' : '') + '</div>' +
        '<div class="qz-q">' + esc(q.q) + '</div>' +
        opts + feedback +
      '</div>' +
      '<div class="qz-keys">Keys: 1–4 or A–D to choose, Enter to continue</div>' +
      '<div class="qz-act"><div class="qz-act-in">' + btn + '</div></div>' +
    '</div>';
  if (answered) {
    const fb = overlay.querySelector('.qz-fb');
    if (fb && fb.getBoundingClientRect().top > window.innerHeight - 160) fb.scrollIntoView({behavior:'smooth', block:'center'});
  }
}

function _selectAnswer(idx) {
  if (_quiz.answered) return;
  _quiz.selected = idx;
  _renderQuiz();
}

function _submitAnswer() {
  if (_quiz.selected === null || _quiz.answered) return;
  _quiz.answered = true;
  const q = _quiz.questions[_quiz.current];
  const correct = _quiz.selected === q.correct;
  if (correct) _quiz.score++;
  _quiz.results.push({ correct, selected: _quiz.selected, correctIdx: q.correct });
  // AI-generated sets aren't in the bank, so they can't be served again later.
  if (_quiz.type !== 'ai') { _qbHist(_quiz.section)[_qbId(q)] = correct ? 1 : 0; _quiz.histDirty = true; }
  _renderQuiz();
}

function _nextQuestion() {
  _quiz.current++;
  _quiz.selected = null;
  _quiz.answered = false;
  _renderQuiz();
  const o = document.getElementById('quiz-overlay'); if (o) o.scrollTop = 0;
}

// Keyboard: 1–4 / A–D pick an answer, Enter checks it or moves on, Esc closes.
document.addEventListener('keydown', function(e) {
  const o = document.getElementById('quiz-overlay');
  if (!_quiz || !_quiz.active || !o || o.style.display === 'none') return;
  if (e.metaKey || e.ctrlKey || e.altKey || /input|textarea|select/i.test((e.target || {}).tagName || '')) return;
  const k = e.key.toLowerCase();
  if (_quiz.finished) { if (k === 'escape') closeQuizOverlay(); return; }
  const idx = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
  if (idx >= 0 && !_quiz.answered && _quiz.questions[_quiz.current].choices[idx] !== undefined) { e.preventDefault(); _selectAnswer(idx); }
  else if (k === 'enter') {
    e.preventDefault();
    if (!_quiz.answered) _submitAnswer();
    else if (_quiz.current < _quiz.questions.length - 1) _nextQuestion();
    else _finishQuiz();
  } else if (k === 'escape') closeQuizOverlay();
});

function _finishQuiz() {
  if (_quiz.timerInterval) clearInterval(_quiz.timerInterval);
  if (_quiz.finished) return;
  _quiz.finished = true;
  const { section, score, questions, results, type } = _quiz;
  const done = results.length;
  const total = questions.length;
  const pct = done ? Math.round(score / done * 100) : 0;
  const grade = pct >= 75 ? {label:'Passing level', c:'var(--grn)'} : pct >= 55 ? {label:'Getting close', c:'var(--amb)'} : {label:'Needs review', c:'var(--red)'};

  // Save progress: only questions actually answered count.
  S.qbProgress = S.qbProgress || {};
  const p = S.qbProgress[section] = S.qbProgress[section] || {mcqDone:0};
  p.mcqDone = Math.min((p.mcqDone || 0) + done, 99999);
  p.graded = (p.graded || 0) + done;
  p.correct = (p.correct || 0) + score;
  _quiz.histDirty = false;
  saveState();

  const overlay = document.getElementById('quiz-overlay');
  if (!overlay) return;
  const L = ['A','B','C','D'];

  // Topics with misses, worst first.
  const byTopic = {};
  questions.forEach(function(q, i) {
    const r = results[i]; if (!r || !q.topic) return;
    const t = byTopic[q.topic] = byTopic[q.topic] || {n:0, miss:0};
    t.n++; if (!r.correct) t.miss++;
  });
  const weak = Object.keys(byTopic).filter(function(t){ return byTopic[t].miss; })
    .sort(function(a, b){ return byTopic[b].miss - byTopic[a].miss; }).slice(0, 4);
  const weakHTML = weak.length
    ? '<div class="qr-weak"><div class="qb-eyebrow" style="margin-top:0">Topics to review</div>' +
        weak.map(function(t){ return '<div class="qr-weak-row"><span>' + esc(t) + '</span><span>' + byTopic[t].miss + ' missed</span></div>'; }).join('') +
      '</div>'
    : '';

  const missed = results.filter(function(r){ return r && !r.correct; }).length;
  // Missed review: how many were cleared and how many are still on the list.
  const left = type === 'missed' ? _qbHistStats(section, (_qbBankCache[section] || {}).questions).missed : 0;
  const reviewHTML = type === 'missed'
    ? '<div class="qr-clear' + (left ? '' : ' done') + '">' + ico(left ? 'refresh' : 'check') + '<span>' +
        (score ? '<b>' + score + ' cleared</b> from your missed list. ' : '') +
        (left ? left.toLocaleString() + ' still to retry.' : 'Your missed list for ' + section + ' is empty.') +
      '</span></div>'
    : '';
  const rows = questions.map(function(q, i) {
    const r = results[i];
    if (!r) return '';
    return '<div class="qr-row" data-ok="' + (r.correct ? 1 : 0) + '">' +
      '<div class="qr-row-h"><span class="qr-dot" style="background:' + (r.correct ? 'var(--grn)' : 'var(--red)') + '">' + ico(r.correct ? 'check' : 'x') + '</span>Question ' + (i + 1) + (q.topic ? ' · ' + esc(q.topic) : '') + '</div>' +
      '<div class="qr-q">' + esc(q.q) + '</div>' +
      '<div class="qr-a"><b style="color:' + (r.correct ? 'var(--grn)' : 'var(--red)') + '">You chose ' + L[r.selected] + ':</b> ' + esc(q.choices[r.selected]) + '</div>' +
      (r.correct ? '' : '<div class="qr-a"><b style="color:var(--grn)">Answer ' + L[q.correct] + ':</b> ' + esc(q.choices[q.correct]) + '</div>') +
      '<div class="qz-exp">' + esc(q.exp) + '</div>' +
    '</div>';
  }).join('');

  const R = 52, C = 2 * Math.PI * R;
  const ring = '<div class="qr-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="' + R + '" fill="none" stroke="var(--surf3)" stroke-width="10"/>' +
    '<circle cx="60" cy="60" r="' + R + '" fill="none" stroke="' + grade.c + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - pct / 100)).toFixed(1) + '"/></svg>' +
    '<div class="qr-pct">' + pct + '%</div></div>';

  const retry = '_quiz.finished=false;openQuizModal(\'' + section + '\',\'' + type + '\',' + (_quiz.topic ? JSON.stringify(_quiz.topic).replace(/"/g, '&quot;') : 'null') + (_quiz.count ? ',' + _quiz.count + (_quiz.timed ? ',true' : '') : '') + ')';

  overlay.innerHTML =
    '<div class="qz" style="' + _qbVars(section) + '">' +
      '<div class="qz-top">' +
        '<button class="qb-x" onclick="closeQuizOverlay()" aria-label="Close">' + ico('x') + '</button>' +
        '<span class="qb-chip">' + section + '</span>' +
        '<span class="qz-mode">' + esc(_qbTypeLabel(type, _quiz.topic, _quiz.timed)) + ' · Results</span>' +
      '</div>' +
      '<div class="qr-hero">' + ring +
        '<div style="min-width:0"><div class="qr-grade" style="color:' + grade.c + '">' + grade.label + '</div>' +
        '<div class="qr-sub">' + score + ' of ' + done + ' correct' + (done < total ? ' · ' + (total - done) + ' not answered' : '') + '</div>' +
        '<div class="qr-sub" style="color:var(--mut);font-size:12px">The exam passing score is 75.</div></div>' +
      '</div>' +
      reviewHTML + weakHTML +
      (done ? '<div class="qr-tabs"><button class="qr-tab on" onclick="_qrFilter(this,false)">All ' + done + '</button>' +
        (missed ? '<button class="qr-tab" onclick="_qrFilter(this,true)">Missed ' + missed + '</button>' : '') + '</div>' +
        '<div class="qr-list">' + rows + '</div>' : '') +
      '<div class="qb-disc" style="border:none;margin-top:8px">Original practice questions written with AI help. They may contain errors, so check anything surprising against your review course.</div>' +
      '<div class="qz-act"><div class="qz-act-in' + (missed && type !== 'ai' && type !== 'missed' ? ' three' : '') + '">' +
        '<button class="qz-btn ghost" onclick="closeQuizOverlay()">Done</button>' +
        (missed && type !== 'ai' && type !== 'missed'
          ? '<button class="qz-btn ghost" onclick="_quiz.finished=false;openQuizModal(\'' + section + '\',\'missed\')">Retry missed</button>' : '') +
        (type === 'missed' && !left
          ? '<button class="qz-btn" onclick="_quiz.finished=false;openQuizModal(\'' + section + '\',\'mcq\')">New practice set</button>'
          : '<button class="qz-btn" onclick="' + retry + '">' + (type === 'missed' ? 'Keep reviewing' : 'Practice again') + '</button>') +
      '</div></div>' +
    '</div>';
  overlay.scrollTop = 0;
}
function _qrFilter(btn, missedOnly) {
  btn.parentNode.querySelectorAll('.qr-tab').forEach(function(b){ b.classList.toggle('on', b === btn); });
  const list = document.querySelector('#quiz-overlay .qr-list');
  if (list) list.classList.toggle('missed', missedOnly);
}

function openQBSection(code) {
  const sec = QB_SECTIONS.find(function(s){ return s.code === code; });
  if (!sec) return;
  const pro = isPro();
  const elite = isElite();
  const quota = _aiQbQuota(code);
  const prog = (S.qbProgress || {})[code] || {mcqDone:0};
  const done = prog.mcqDone || 0;
  const acc = prog.graded ? Math.round(prog.correct / prog.graded * 100) + '% correct' : 'No score yet';

  let overlay = document.getElementById('qb-section-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'qb-section-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:650;display:flex;align-items:flex-start;overflow-y:auto;overscroll-behavior:contain;--ov:1;justify-content:center;padding:20px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)';
    overlay.addEventListener('click', function(e){ if(e.target===overlay) closeQBSection(); });
    document.body.appendChild(overlay);
  }

  const modes = [
    {type:'mcq',    icon:'pencil', label:'Practice set', desc: pro ? '20 questions from across the section' : 'Try 5 free questions', free:true},
    {type:'random', icon:'dice',   label:'Random quiz',  desc: elite ? '50 shuffled questions, any topic' : 'Shuffled questions, any topic', free:false},
    {type:'timed',  icon:'timer',  label:'Timed set',    desc:'10 questions in 10 minutes, like exam pace', free:false},
  ];
  const hs = _qbHistStats(code, (_qbBankCache[code] || {}).questions);
  if (!hs.total) hs.total = sec.mcqTotal;
  const missedHTML =
    '<button type="button" id="qb-missed-btn" class="qb-mode' + (hs.missed ? '' : ' off') + '" onclick="closeQBSection();openQuizModal(\'' + code + '\',\'missed\')"' + (hs.missed ? '' : ' disabled') + '>' +
      '<span class="qb-mode-ico">' + ico('refresh') + '</span>' +
      '<span style="flex:1;min-width:0"><span class="qb-mode-t">Missed questions<span class="qb-n" id="qb-missed-n"' + (hs.missed ? '' : ' hidden') + '>' + hs.missed + '</span></span>' +
      '<span class="qb-mode-d" id="qb-missed-d" style="display:block">' + _qbMissedDesc(hs.missed, pro) + '</span></span>' +
      '<span class="qb-chev">' + ico('arrow') + '</span></button>';
  const modeHTML = modes.map(function(m) {
    const locked = !pro && !m.free;
    return '<button type="button" class="qb-mode' + (locked ? ' locked' : '') + '" onclick="' + (locked ? 'openUpgradeModal(\'Question Bank — ' + m.label + '\')' : 'closeQBSection();openQuizModal(\'' + code + '\',\'' + m.type + '\')') + '">' +
      '<span class="qb-mode-ico">' + ico(m.icon) + '</span>' +
      '<span style="flex:1;min-width:0"><span class="qb-mode-t">' + m.label + (locked ? '<span class="qb-pro">PRO</span>' : '') + '</span><span class="qb-mode-d" style="display:block">' + m.desc + '</span></span>' +
      '<span class="qb-chev">' + ico(locked ? 'lock' : 'arrow') + '</span></button>';
  }).join('');

  // Custom quiz: the student picks the length. Capped by the bank size, and for
  // metered Pro by what's left of today's allowance (openQuizModal clamps again).
  const customMax = elite ? (sec.mcqTotal || 500) : quota.remaining;
  const customDef = Math.max(1, Math.min(25, customMax));
  const customHTML = !pro
    ? '<button type="button" class="qb-mode locked" onclick="openUpgradeModal(\'Question Bank — Custom quiz\')">' +
        '<span class="qb-mode-ico">' + ico('target') + '</span>' +
        '<span style="flex:1;min-width:0"><span class="qb-mode-t">Custom quiz<span class="qb-pro">PRO</span></span><span class="qb-mode-d" style="display:block">Choose how many questions you want</span></span>' +
        '<span class="qb-chev">' + ico('lock') + '</span></button>'
    : '<div class="qb-mode qb-custom">' +
        '<span class="qb-mode-ico">' + ico('target') + '</span>' +
        '<span style="flex:1;min-width:0"><span class="qb-mode-t">Custom quiz</span><span class="qb-mode-d" style="display:block">' +
          (customMax > 0 ? 'Choose how many questions your quiz has (up to ' + customMax.toLocaleString() + ')' : "You've used today's questions for this section") + '</span></span>' +
        '<div class="qb-custom-ctl">' +
          '<label class="qb-custom-n" for="qb-custom-n">' +
            '<input id="qb-custom-n" type="number" inputmode="numeric" min="1" max="' + customMax + '" value="' + customDef + '"' + (customMax > 0 ? '' : ' disabled') +
            ' aria-label="Number of questions in the quiz" oninput="_customQuizLabel()" onkeydown="if(event.key===\'Enter\'){_startCustomQuiz(\'' + code + '\')}">' +
            '<span>questions</span></label>' +
          '<label class="qb-custom-t"><input id="qb-custom-timed" type="checkbox"' + (customMax > 0 ? '' : ' disabled') + ' onchange="_customQuizLabel()">' +
            '<span>' + ico('timer') + 'Timed <span class="qb-custom-t-d">· 1 min per question</span></span></label>' +
          '<button type="button" id="qb-custom-go" class="qz-btn qb-custom-go"' + (customMax > 0 ? '' : ' disabled') + ' onclick="_startCustomQuiz(\'' + code + '\')">' + _customQuizBtn(customDef) + '</button>' +
        '</div>' +
      '</div>';

  let aiBlock;
  if (!pro) {
    aiBlock = '<button type="button" class="qb-mode locked" onclick="openUpgradeModal(\'AI Question Generator\')">' +
      '<span class="qb-mode-ico">' + ico('sparkles') + '</span>' +
      '<span style="flex:1;min-width:0"><span class="qb-mode-t">Generate new questions<span class="qb-pro">PRO</span></span><span class="qb-mode-d" style="display:block">Fresh AI-written questions on any topic you name</span></span>' +
      '<span class="qb-chev">' + ico('lock') + '</span></button>';
  } else {
    const disabled = !elite && quota.remaining <= 0;
    const quotaLabel = elite ? 'Unlimited for Pro' : (quota.remaining + ' of ' + AI_QB_PRO_DAILY + ' left today');
    aiBlock =
      '<div class="qb-ai">' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--txt)"><span style="color:var(--ind)">' + ico('sparkles') + '</span>Generate new questions</div>' +
        '<div style="font-size:12px;color:var(--sub);margin-top:4px;line-height:1.5">Leave the topic blank for a mixed set, or name one for a focused drill.</div>' +
        '<input id="ai-qb-topic" type="text" placeholder="e.g. ASC 842 lease modifications" onkeydown="if(event.key===\'Enter\'){generateAIQuestions(\'' + code + '\',this.value)}">' +
        '<button class="qz-btn" style="width:100%;padding:11px;font-size:13.5px;background:var(--ind)" ' + (disabled ? 'disabled' : '') + ' onclick="generateAIQuestions(\'' + code + '\',(document.getElementById(\'ai-qb-topic\')||{}).value||\'\')">Generate ' + AI_QB_SET_SIZE + ' questions</button>' +
        '<div style="font-size:11px;color:var(--mut);text-align:center;margin-top:8px">' + quotaLabel + '</div>' +
      '</div>';
  }

  overlay.innerHTML =
    '<div class="qb-sheet" role="dialog" aria-label="' + sec.full + '" style="' + _qbVars(code) + '">' +
      '<div class="qb-sheet-head">' +
        '<div style="display:flex;align-items:center;justify-content:space-between"><span class="qb-chip">' + code + '</span>' +
        '<button class="qb-x" onclick="closeQBSection()" aria-label="Close">' + ico('x') + '</button></div>' +
        '<div class="qb-title">' + sec.full + '</div>' +
        '<div id="qb-prog">' + _qbProgHTML(hs, done, acc) + '</div>' +
      '</div>' +
      '<div class="qb-body">' +
        '<div class="qb-eyebrow">Practice</div>' + (hs.missed ? missedHTML + modeHTML + customHTML : modeHTML + customHTML + missedHTML) +
        '<div class="qb-eyebrow" style="margin-top:16px">Drill a topic' + (pro ? '' : '<span class="qb-pro">PRO</span>') + '</div>' +
        '<div id="qb-topic-list"><div class="qb-skel"></div></div>' +
        '<div class="qb-eyebrow" style="margin-top:18px">AI questions</div>' + aiBlock +
        '<div class="qb-note qb-disc" style="margin-top:16px">Original practice questions written with AI help, not official AICPA questions. They may contain errors, so check anything surprising against your review course.</div>' +
      '</div>' +
    '</div>';
  overlay.style.display = 'flex';

  loadQuestionBank(code).then(function(bank) {
    // Refresh the counts against the real bank (history may hold removed questions).
    const st = _qbHistStats(code, bank);
    const progEl = document.getElementById('qb-prog'); if (progEl) progEl.innerHTML = _qbProgHTML(st, done, acc);
    const mb = document.getElementById('qb-missed-btn'), mn = document.getElementById('qb-missed-n'), md = document.getElementById('qb-missed-d');
    if (mb) { mb.disabled = !st.missed; mb.classList.toggle('off', !st.missed); }
    if (mn) { mn.textContent = st.missed; mn.hidden = !st.missed; }
    if (md) md.textContent = _qbMissedDesc(st.missed, pro);
    const box = document.getElementById('qb-topic-list');
    if (!box) return;
    const counts = {}, order = [];
    (bank || []).forEach(function(q){ if (!q.topic) return; if (!counts[q.topic]) { counts[q.topic] = 0; order.push(q.topic); } counts[q.topic]++; });
    if (!order.length) { box.innerHTML = '<div class="qb-mode-d">Topic drills will appear once the bank loads.</div>'; return; }
    const many = order.length > 6;
    box.innerHTML = '<div class="qb-topics' + (many ? ' short' : '') + '">' + order.map(function(t) {
      const go = pro ? 'closeQBSection();openQuizModal(\'' + code + '\',\'topic\',' + JSON.stringify(t).replace(/"/g, '&quot;') + ')' : 'openUpgradeModal(\'Question Bank — Topic drills\')';
      return '<button type="button" class="qb-topic" onclick="' + go + '"><span class="qb-topic-name">' + esc(t) + '</span><span class="qb-topic-n">' + counts[t] + '</span><span class="qb-chev" style="margin-left:0">' + ico(pro ? 'arrow' : 'lock') + '</span></button>';
    }).join('') + '</div>' +
    (many ? '<button class="qb-more" onclick="this.previousElementSibling.classList.remove(\'short\');this.remove()">Show all ' + order.length + ' topics</button>' : '');
  });
}

function _qbMissedDesc(n, pro) {
  if (!n) return 'Questions you get wrong collect here so you can retry them';
  return 'Retry the ' + (n === 1 ? 'question' : n.toLocaleString() + ' questions') + ' you got wrong' + (pro || n <= 5 ? '' : ', 5 at a time') + '. Get one right and it leaves the list';
}
// Header progress. Once per-question history exists the bar tracks unique
// questions seen; before that it falls back to the old answered count.
function _qbProgHTML(st, done, acc) {
  const total = st.total || 1;
  const n = st.seen || done;
  const pct = Math.min(100, Math.round(n / total * 100));
  const head = st.seen
    ? '<b style="color:var(--txt)">' + st.seen.toLocaleString() + '</b> of ' + total.toLocaleString() + ' seen'
    : '<b style="color:var(--txt)">' + done.toLocaleString() + '</b> of ' + total.toLocaleString() + ' answered';
  const note = !st.seen ? 'Questions you haven\'t answered yet come first'
    : st.seen >= total ? 'You\'ve seen every question. Repeats come up now, so focus on your misses'
    : (total - st.seen).toLocaleString() + ' new questions left, served first' + (done > st.seen ? ' · ' + done.toLocaleString() + ' answers in total' : '');
  return '<div class="qb-bar"><i style="width:' + pct + '%"></i></div>' +
    '<div class="qb-meta"><span>' + head + '</span><span>' + acc + '</span></div>' +
    '<div class="qb-seen">' + note + '</div>';
}

function _customQuizBtn(n, timed) {
  const kind = timed ? 'timed quiz' : 'quiz';
  if (!(n > 0)) return 'Start ' + kind;
  const mins = timed ? ' (' + (n >= 60 ? Math.floor(n / 60) + 'h' + (n % 60 ? ' ' + (n % 60) + 'm' : '') : n + ' min') + ')' : '';
  return 'Start ' + n.toLocaleString() + '-question ' + kind + mins;
}
function _customQuizLabel() {
  const el = document.getElementById('qb-custom-n'), btn = document.getElementById('qb-custom-go');
  if (!el || !btn) return;
  const max = Number(el.max) || 0;
  let n = Math.floor(Number(el.value)) || 0;
  if (max && n > max) n = max;
  const t = document.getElementById('qb-custom-timed');
  btn.textContent = _customQuizBtn(n, !!(t && t.checked));
}

function _startCustomQuiz(code) {
  const el = document.getElementById('qb-custom-n');
  const max = Number(el && el.max) || 0;
  const n = Math.floor(Number(el && el.value));
  if (!n || n < 1) { showToast('Enter how many questions you want', 'info'); if (el) el.focus(); return; }
  closeQBSection();
  const t = document.getElementById('qb-custom-timed');
  openQuizModal(code, 'custom', null, max ? Math.min(n, max) : n, !!(t && t.checked));
}

function closeQBSection() {
  const overlay = document.getElementById('qb-section-overlay');
  if (overlay) overlay.style.display = 'none';
}

