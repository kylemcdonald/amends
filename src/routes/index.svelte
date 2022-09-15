<script>
	import "atropos/css";
	import Atropos from "atropos/svelte";
	import { onMount } from "svelte";

	import "../app.css";
	import tco2 from "$lib/tco2.json";
	import links from "$lib/links.json";

	let marketplaces = [
		{
			id: "opensea",
			overhead: 0.025,
			royalties: 0,
			volatility: 0,
			purchased_offsets: 0,
			name: "OpenSea",
			alt: "Render of glass block filled with olivine.",
			provider: {
				name: "Project Vesta",
				price_per_tco2: 750.0,
				fixed_tco2: 50,
				description:
					"Project Vesta is harnessing the power of the oceans to remove excess CO₂ from the atmosphere. They are accelerating the natural process of coastal mineralization by releasing olivine, a naturally occurring green sand, into the waves. This process simultaneously captures CO₂ and de-acidifies the ocean. OpenSea is represented by olivine.",
				link: "https://www.vesta.earth",
			},
		},
		{
			id: "rarible",
			overhead: 0.01,
			royalties: 0,
			volatility: 0,
			purchased_offsets: 1000,
			name: "Rarible",
			alt: "Render of glass block filled with carbon-rich soil.",
			provider: {
				name: "Nori",
				price_per_tco2: 23.0,
				fixed_tco2: 0,
				description:
					"Nori is working with farmers to sink CO₂ directly into the soil. Regenerative practices like cover crop planting and no-till farming can remove over a ton of CO₂ from the atmosphere per acre of land. Rarible is represented by carbon-rich soil.",
				link: "https://nori.com/",
			},
		},
		{
			id: "foundation",
			overhead: 0.05,
			royalties: 0,
			volatility: 0.1,
			purchased_offsets: 0,
			name: "Foundation",
			alt: "Render of glass block filled with shredded metal.",
			provider: {
				name: "Tradewater",
				price_per_tco2: 17.0,
				fixed_tco2: 0,
				description:
					"Tradewater finds and destroys the most harmful greenhouse gases before they leak into the atmosphere. They focus on old refrigerants that are over 10,000 times more potent than CO₂. To date Tradewater has destroyed over five million tons CO₂e, and a recent study estimates there are still nine billion tons CO₂e waiting to be destroyed. Foundation is represented by shredded refrigerant cylinders.",
				link: "https://tradewater.us/",
			},
		},
	];

	const merge_date = new Date(Date.UTC(2022, 8, 15, 5, 14, 0));
	const nonprofit_overhead = 0.1;
	const exchange_overhead = 0.015;

	let countdown = {
		days: "0",
		hhmmss: "0",
	};

	function sum(array) {
		return array.reduce((a, b) => a + b);
	}

	function average(array) {
		return sum(array) / array.length;
	}

	/* incorrect if future is in the past */
	function time_until_date(date_future) {
		let date_now = new Date();
		let milliseconds = date_future.getTime() - date_now.getTime();
		let seconds = Math.abs(milliseconds) / 1000;
		let days = Math.floor(seconds / 86400);
		seconds -= days * 86400;
		let hours = Math.floor(seconds / 3600) % 24;
		seconds -= hours * 3600;
		let minutes = Math.floor(seconds / 60) % 60;
		seconds -= minutes * 60;
		seconds = Math.floor(seconds);
		return {
			days: days,
			hours: hours,
			minutes: minutes,
			seconds: seconds,
		};
	}

	function updateCountdown() {
		let t = time_until_date(merge_date);
		let hours = String(t.hours);
		let minutes = String(t.minutes).padStart(2, "0");
		let seconds = String(t.seconds).padStart(2, "0");
		countdown.days = `${t.days}`;
		countdown.hhmmss = `${hours}:${minutes}:${seconds}`;
	}

	function format_short(x, digits = 2) {
		const parts = x
			.toLocaleString(undefined, {
				minimumFractionDigits: digits,
				maximumFractionDigits: digits,
			})
			.split(".");
		let formatted = parts[0];
		if (parts.length > 0 && parseInt(parts[1]) != 0) {
			formatted += "." + parts[1];
		}
		return formatted;
	}

	function format(x, digits = 2) {
		const parts = x
			.toLocaleString(undefined, {
				minimumFractionDigits: digits,
				maximumFractionDigits: digits,
			})
			.split(".");
		return `${parts[0]}.<span class="text-xs">${parts[1]}</span>`;
	}

	function convert_usd_to_eth(usd) {
		return usd / tco2.current_price;
	}

	// https://codepen.io/jamesdoc/pen/qBbeOym
	function attachObserver() {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("animate-fade-in");
				} else {
					entry.target.classList.remove("animate-fade-in");
				}
			});
		});

		const targets = document.querySelectorAll(".fade-on-scroll");
		targets.forEach(function (target) {
			target.classList.add("opacity-0");
			observer.observe(target);
		});
	}

	// sum the providers which provide fixed amounts of offsets
	const fixed_tco2 = sum(marketplaces.map((e) => e.provider.fixed_tco2));
	const for_fixed_tco2 = sum(
		marketplaces.map(
			(e) => e.provider.fixed_tco2 * e.provider.price_per_tco2
		)
	);

	// average the price from providers who don't provide fixed amounts
	const variable_providers = marketplaces.filter(
		(e) => e.provider.fixed_tco2 == 0
	);
	const usd_per_tco2 =
		1 /
		average(variable_providers.map((e) => 1 / e.provider.price_per_tco2));

	let printed = false;

	async function updateStats() {
		const ms_per_day = 8.64e7;
// 		const current_time = new Date();
		const current_time = new Date(Date.UTC(2022, 8, 15, 6, 42, 42));
		const last_updated = new Date(tco2.updated * 1000);
		const ms_since_updated =
			current_time.getTime() - last_updated.getTime();
		const pct_of_day = ms_since_updated / ms_per_day;
		let combined_tco2 = 0;
		let combined_usd = 0;

		marketplaces.forEach((e) => {
			const value = tco2.data[e.name];
			const current_tco2 =
				value.total_tco2 +
				pct_of_day * value.daily_tco2 -
				e.purchased_offsets;
			const variable_tco2 = current_tco2 - fixed_tco2;
			const for_variable_tco2 = variable_tco2 * usd_per_tco2;
			const for_tco2 = for_fixed_tco2 + for_variable_tco2;
			const incl_nonprofit = for_tco2 / (1 - nonprofit_overhead);
			const for_nonprofit = incl_nonprofit - for_tco2;
			const incl_exchange = incl_nonprofit / (1 - exchange_overhead);
			const for_exchange = incl_exchange - incl_nonprofit;
			const incl_volatility = incl_exchange / (1 - e.volatility);
			const for_volatility = incl_volatility - incl_exchange;
			const total_overhead = e.overhead + e.royalties;
			const usd = incl_volatility / (1 - total_overhead);
			const for_overhead = usd - incl_volatility;
			const for_platform = (for_overhead * e.overhead) / total_overhead;
			const for_creator = (for_overhead * e.royalties) / total_overhead;

			const eth = convert_usd_to_eth(usd);

			combined_tco2 += current_tco2;
			combined_usd += usd;

			e.total_tco2 = current_tco2;
			e.total_usd = usd;
			e.total_eth = eth;
			e.for_tco2 = for_tco2;
			e.for_nonprofit = for_nonprofit;
			e.for_exchange = for_exchange;
			e.for_volatility = for_volatility;
			e.for_platform = for_platform;
			e.for_creator = for_creator;

			e.breakdown = [];
			const even_split = for_tco2 / variable_providers.length;
			marketplaces.forEach((m) => {
				let provider_price, provider_tco2;
				if (m.provider.fixed_tco2 == 0) {
					provider_tco2 = even_split / m.provider.price_per_tco2;
					provider_price = even_split;
				} else {
					provider_tco2 = m.provider.fixed_tco2;
					provider_price = provider_tco2 * m.provider.price_per_tco2;
				}
				e.breakdown.push([
					provider_price,
					`${format(provider_tco2, 3)} tCO₂ ${m.provider.name}`,
				]);
			});
			e.breakdown.push([
				for_nonprofit,
				`${format_short(
					100 * nonprofit_overhead,
					1
				)}% Fiscal Sponsorship`,
			]);
			e.breakdown.push([
				for_exchange,
				`${format_short(100 * exchange_overhead, 1)}% Exchange Fee`,
			]);
			if (e.volatility > 0) {
				e.breakdown.push([
					for_volatility,
					`${format_short(100 * e.volatility, 1)}% Ether Volatility`,
				]);
			}
			if (e.royalties > 0) {
				e.breakdown.push([
					for_creator,
					`${format_short(100 * e.royalties, 1)}% Required Royalties`,
				]);
			}
			e.breakdown.push([
				for_platform,
				`${format_short(100 * e.overhead, 1)}% ${e.name} Fee`,
			]);
		});

		if (!printed) {
			console.log("Total tCO2: " + combined_tco2.toLocaleString());
			console.log(
				"Total USD: $" +
					combined_usd.toLocaleString(undefined, {
						maximumFractionDigits: 2,
					})
			);
			printed = true;
		}

		// tell svelte we need to update
		marketplaces = marketplaces;
	}

	function loop() {
		requestAnimationFrame(loop);
		updateStats();
	}

	updateCountdown();
	updateStats();

	onMount(async () => {
		attachObserver();
		setInterval(updateCountdown, 1000);
		loop();
	});
</script>

<section
	aria-label="Introduction"
	class="snap-start flex flex-col min-h-screen p-4 gap-4 justify-center items-center"
>
	<h1 class="text-6xl italic font-thin max-w-xl animate-fade-up">
		When a harm ends, how can we make <span class="font-medium not-italic"
			>Amends</span
		>?
	</h1>
</section>

<section
	aria-label="Summary"
	class="snap-start flex flex-row flex-wrap min-h-screen p-4 gap-4 justify-evenly items-center font-extralight"
>
	<div class="flex flex-col gap-4 max-w-xs leading-relaxed fade-on-scroll">
		<!-- 
		<h2 class="text-2xl font-thin">
			{countdown.days} <span class="italic">days</span>
			<span class="amp">&</span> 
			{countdown.hhmmss} <span class="italic">to merge</span>
		</h2>-->
		<p>
			The Ethereum blockchain may soon transition away from the
			high-emissions proof-of-work algorithm. But to escape the worst
			impacts of climate change, we must go beyond emissions reductions,
			and also remove past emissions from the atmosphere.
		</p>
		<p>
			<span class="italic">Amends</span> is three digital sculptures by
			<a
				href="https://kylemcdonald.net/"
				target="_blank"
				class="underline">Kyle McDonald</a
			>, designed to capture all historical emissions from three major art
			NFT marketplaces.
		</p>
		<p>
			When Ethereum <a
				href="https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/"
				target="_blank"
				class="underline">transitions away from proof-of-work</a
			>, <span class="italic">Amends</span>
			will go on sale. The work is priced to fund complete carbon mitigation.
		</p>
		<p>
			Handmade glass blocks, filled with artifacts from each removal
			process, will be revealed a month after launch. These sculptures
			will be shipped to the owners of the NFTs—if they burn their NFT.
		</p>
	</div>
	<div
		class="relative w-[24rem] h-[24rem] xl:w-[30rem] xl:h-[30rem] 2xl:w-[36rem] 2xl:h-[36rem] fade-on-scroll"
	>
		{#each marketplaces as e}
			<Atropos class="atropos atropos-{e.id}" innerClass="rounded-2xl">
				<img src="images/{e.id}.jpg" alt={e.alt} />
			</Atropos>
		{/each}
	</div>
</section>

{#each marketplaces as e}
	<section
		aria-label="Amends for {e.name}"
		class="snap-start flex odd:flex-row-reverse even:flex-row flex-wrap min-h-screen p-4 gap-10 bg-white justify-evenly items-center"
	>
		<div class="max-w-sm xl:max-w-md 2xl:max-w-lg fade-on-scroll">
			<a href={links[e.id]} target="_blank">
				<img
					src="images/{e.id}.jpg"
					alt={e.alt}
					class="rounded-2xl shadow-xl ease-in-out hover:scale-105 duration-300"
				/>
			</a>
		</div>
		<div class="max-w-xs flex flex-col gap-3 text-black fade-on-scroll">
			<h1 class="text-3xl font-light">
				<a href={links[e.id]} target="_blank">Amends for {e.name}</a>
			</h1>
			<div class="relative font-mono border-2 p-4 tracking-tight">
				<input
					id="breakdown"
					type="checkbox"
					class="peer absolute right-0 bottom-0 w-8 h-8 appearance-none cursor-pointer bg-no-repeat bg-center"
				/>
				<label for="breakdown" class="sr-only"
					>Toggle price breakdown</label
				>
				<div class="block peer-checked:hidden">
					<div>
						<span class="inline-block w-2">&nbsp;</span>
						<span id="{e.id}-total-tco2"
							>{@html format(e.total_tco2, 3)}</span
						>
						<tco2sym>tCO<sub>2</sub></tco2sym>
					</div>
					<div>
						<span class="inline-block w-2">$</span>
						<span id="{e.id}-total-usd"
							>{@html format(e.total_usd)}</span
						>
					</div>
					<div>
						<span class="inline-block w-2 font-sans">Ξ</span>
						<span id="{e.id}-total-eth"
							>{@html format(e.total_eth)}</span
						>
					</div>
				</div>
				<div class="hidden peer-checked:block">
					{#each e.breakdown as b}
						<div>
							<span class="inline-block w-2">$</span>
							<span id="{e.id}-total-usd"
								>{@html format(b[0])}</span
							>
						</div>
						<div>
							<span class="inline-block w-2">&nbsp;</span>
							<span id="{e.id}-total-usd" class="text-xs"
								>{@html b[1]}</span
							>
						</div>
					{/each}
				</div>
			</div>
			<p class="font-normal">{e.provider.description}</p>
			<div class="font-normal italic mb-[10rem] lg:mb-0">
				<!-- little bit of a hack, causes a glitch at 1022 pixels -->
				<h2>
					<a href={e.provider.link} class="underline"
						>About {e.provider.name}</a
					>
				</h2>
				<h2>
					<a href={links[e.id]} target="_blank" class="underline"
						>{e.name} listing</a
					>
				</h2>
			</div>
		</div>
	</section>
{/each}

<section
	aria-label="Details and agreements"
	class="snap-start flex flex-row flex-wrap min-h-screen p-4 gap-4 justify-evenly items-center font-extralight"
>
	<div class="flex flex-col gap-4 max-w-xs leading-relaxed fade-on-scroll">
		<p>
			The work is priced at a rate that will pay for a mix of carbon
			removal and reduction from three different providers, plus overhead
			from the marketplaces and for our non-profit partner facilitating
			the auction.
		</p>
		<p>
			Emissions totals are based on a bottom-up estimate of Ethereum
			emissions combined with a value-based accounting of all transaction
			fees associated with each marketplace. This means that the emissions
			allocated to a marketplace is proportional to its transaction fees.
		</p>
		<p>
			For full details, please see the agreements and financial breakdown. <a
				href="mailto:studio@kylemcdonald.net"
				class="underline">Contact us</a
			> for more.
		</p>
	</div>
	<div
		class="max-w-xs document-list italic text-xl leading-loose fade-on-scroll"
	>
		<h2>
			<a
				class="underline"
				target="_blank"
				href="https://drive.google.com/file/d/1JwK_6e6OfCyavxhm3qr7yQCQ-z4p4MtD/view"
				>Gray Area agreement</a
			>
		</h2>
		<h2>
			<a
				class="underline"
				target="_blank"
				href="https://drive.google.com/file/d/1JwhDQmHcHYT1xrzerewEdACsJKJi272e/view"
				>Offsets agreement</a
			>
		</h2>
		<h2>
			<a
				class="underline"
				target="_blank"
				href="https://docs.google.com/document/d/e/2PACX-1vT7u2MCu3HAbFCu92h5lQ1Zk1DKaFxeEbB7elB6y0VybUFT_MEiZy5_-Fu7vHyxgH8F9KXrnyF3jl4o/pub"
				>Financial breakdown</a
			>
		</h2>
		<h2>
			<a
				class="underline"
				target="_blank"
				href="https://docs.google.com/document/d/e/2PACX-1vRzyeXVb4QqeLuuvmDjSCZ97OWaAOlAwg7b478EdoHunlekOnrau0NDhkbXeoI-Gi58h00KrlIVWVci/pub"
				>Press release</a
			>
		</h2>
	</div>
</section>

<!--
	<section
		aria-label="Q&A"
		class="snap-start flex flex-col min-h-screen p-4 gap-4 justify-center">
		<p class="text-3xl">Questions</p>
		<div class="font-extralight">
			<details>
				<summary class="select-none cursor-pointer">
					How are the totals estimated?
				</summary>
				<div>
					We use a bottom-up estimate of Ethereum emissions combined
					with a value-based accounting of all fees spent on Ethereum
					transactions for each marketplace.
				</div>
			</details>
			<details>
				<summary class="select-none cursor-pointer">
					How do carbon offsets work?
				</summary>
				<div>
					The voluntary carbon offset market has historically been
					used by polluters to avoid making reductions. And yet, the
					work of many carbon offset providers is incredibly
					important.
				</div>
			</details>
			<details>
				<summary class="select-none cursor-pointer">
					Is this another offset fundraiser?
				</summary>
				<div>
					Unlike other fundraisers, this project aims to repair damage
					only once the harm is no longer ongoing.
				</div>
			</details>
			<details>
				<summary class="select-none cursor-pointer">
					What about other offset fundraisers?
				</summary>
				<div>
					If you believe that some offsets have been applied to an NFT
					on one of these marketplaces, please get in touch and we
					will subtract it from our total.
				</div>
			</details>
			<details>
				<summary class="select-none cursor-pointer">
					How do you know when Ethereum is switching to proof-of-stake?
				</summary>
				<div>
					The estimate of June 1, 2022 is based on the difficulty increase.
				</div>
			</details>
			<details>
				<summary class="select-none cursor-pointer">
					What about Nifty Gateway and other marketplaces?
				</summary>
				<div>
					After discussions with Nifty Gateway, Super Rare, and
					others, they decided not to support this project.
				</div>
			</details>
		</div>
	</section>
	-->

<section
	aria-label="Credits"
	class="snap-start flex flex-col min-h-screen p-4 gap-4 justify-center font-extralight leading-relaxed items-center fade-on-scroll"
>
	<table>
		<tr class="leading-[4]">
			<th>Created By</th>
			<td><a href="mailto:studio@kylemcdonald.net">Kyle McDonald</a></td>
		</tr>
		<tr>
			<th>Visual Art</th>
			<td>Robert Hodgin</td>
		</tr>
		<tr>
			<th>Producer</th>
			<td>Keira Heu-Jwyn Chang</td>
		</tr>
		<tr>
			<th>Assistant Producer</th>
			<td>Lisa Kori</td>
		</tr>
		<tr>
			<th>Sponsored by</th>
			<td>Gray Area</td>
		</tr>
		<tr>
			<th>Offset Partner</th>
			<td>Project Vesta</td>
		</tr>
		<tr>
			<th>Offset Partner</th>
			<td>Tradewater</td>
		</tr>
		<tr>
			<th>Offset Partner</th>
			<td>Nori</td>
		</tr>
		<tr>
			<th>Glasswork</th>
			<td>Kazuki Takazawa</td>
		</tr>
	</table>
	<img src="images/logos.png" alt="Logos of all partners." width="700" />
</section>

<p hidden>Updated {tco2.updated} {new Date(tco2.updated * 1000)}</p>

<style>
</style>
