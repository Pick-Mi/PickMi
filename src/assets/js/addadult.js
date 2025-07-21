(function ($) {
	"use strict";
	
	(function () {

		// Add Adult & childElementCount
		const guestBtn = document.querySelector("#guests-input-btn"),
			guestOptions = document.querySelector("#guests-input-options"),
			adultsSubsBtn = document.querySelector("#adults-subs-btn"),
			adultsAddBtn = document.querySelector("#adults-add-btn"),
			childrenSubsBtn = document.querySelector("#children-subs-btn"),
			childrenAddBtn = document.querySelector("#children-add-btn"),
			adultsCountEl = document.querySelector("#guests-count-adults"),
			childrenCountEl = document.querySelector("#guests-count-children");
		let maxNumGuests = 15,
			isGuestInputOpen = false,
			adultsCount = 1,
			childrenCount = 0;
		updateValues();
		guestBtn.addEventListener('click', function (e) {
			if (isGuestInputOpen) {
				guestBtn.classList.remove("open");
				guestOptions.classList.remove("open");
			} else {
				guestBtn.classList.add("open");
				guestOptions.classList.add("open");
			}
			isGuestInputOpen = isGuestInputOpen ? false : true;
			e.preventDefault();
		});
		adultsAddBtn.addEventListener('click', function () {
			adultsCount = addValues(adultsCount);
			updateValues();
		});
		adultsSubsBtn.addEventListener('click', function () {
			adultsCount = substractValues(adultsCount, 1);
			updateValues();
		});
		childrenAddBtn.addEventListener('click', function () {
			childrenCount = addValues(childrenCount);
			updateValues();
		});
		childrenSubsBtn.addEventListener('click', function () {
			childrenCount = substractValues(childrenCount, 0);
			updateValues();
		});

		function calcTotalGuests() {
			return adultsCount + childrenCount;
		}

		function addValues(count) {
			return (calcTotalGuests() < maxNumGuests) ? count + 1 : count;
		}

		function substractValues(count, min) {
			return (count > min) ? count - 1 : count;
		}

		function updateValues() {
			let btnText = `${adultsCount} Guests`;
			btnText += (childrenCount > 0) ? `, ${childrenCount} Childs` : '';
			guestBtn.innerHTML = btnText;
			adultsCountEl.innerHTML = adultsCount;
			childrenCountEl.innerHTML = childrenCount;
			if (adultsCount == 1) {
				adultsSubsBtn.classList.add("disabled");
			} else {
				adultsSubsBtn.classList.remove("disabled");
			} if (childrenCount == 0) {
				childrenSubsBtn.classList.add("disabled");
			} else {
				childrenSubsBtn.classList.remove("disabled");
			} if (calcTotalGuests() == maxNumGuests) {
				adultsAddBtn.classList.add("disabled");
				childrenAddBtn.classList.add("disabled");
			} else {
				adultsAddBtn.classList.remove("disabled");
				childrenAddBtn.classList.remove("disabled");
			}
		}

	})();
	
	
})(this.jQuery);