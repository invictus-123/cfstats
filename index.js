// Setting up
var express = require("express");
var app = express();
var request = require("request");
var handle;
var data;

app.use(express.static("public"));
app.set("view engine", "ejs");

app.get("/", function(req, res) {
	res.render("home", {title : "Home"});
});



// Code for search feature -

// This snippet retrieves handle from search box
app.get("/getHandle", function(req, res) {
	handle = req.query.handle;
	var url = "https://codeforces.com/api/user.info?handles=" + handle;
	request(url, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var temp = JSON.parse(body);
			handle = String(temp.result[0].handle);
			res.redirect("/getData")
		}
		else {
			res.render("error", {title : "Error", message: "user not found"});
		}
	});
});


// This snippet fetches the data for searched user
app.get("/getData", function(req, res) {
	var url = "https://codeforces.com/api/user.rating?handle=" + handle;
	request(url, function(error, response, body) {
		data = JSON.parse(body);
		res.redirect("/userRatingCurve")
	});
});


// This snippet generates the rating vs contests curve
var contestid = [];
var userRating = [];
var contestCount = 0, curRating = 0, maxRating = 0;
app.get("/userRatingCurve", function(req, res) {
	getRatingCurve();
	res.redirect("/problemsRatingDistribution");
});

function getRatingCurve() {
	var cnt = 0;
	maxRating = 0, curRating = 0, contestCount = 0;
	userRating = [1500], contestid = [0];
	data["result"].forEach(function(contest) {
		contestCount ++;
		curRating = contest["newRating"];
		maxRating = Math.max(maxRating, curRating);
		contestid.push(++ cnt);
		userRating.push(contest["newRating"]);
	});
}


// This snippet generates the bar graph based on problem ratings
var problemRating = [];
var problemCount = [];
var solvedProblems = 0;
app.get("/problemsRatingDistribution", function(req, res) {
	var url = "https://codeforces.com/api/user.status?handle=" + handle;
	request(url, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			data = JSON.parse(body);
			getProblemsRatingDistribution();
			res.redirect("problemsTagDistribution");
		}
		else {
			res.render("error", {title : "Error"});
		}
	});
});

function getProblemsRatingDistribution() {
	problemRating = [], problemCount = [];
	var map = new Map();
	var set = new Set();
	data["result"].forEach(function(problem) {
		if(problem.verdict == "OK") {
			var problemid = String(problem.contestId) + problem.problem.index;
			if(!set.has(problemid)) {
				var rating = String(problem.problem.rating);
				if(rating.length < 4) {
					rating = '0' + rating;
				}
				if(map.has(rating)) {
					map.set(rating, map.get(rating) + 1);
				}
				else {
					map.set(rating, 1);
				}
				set.add(problemid);
			 }
		}
	});
	var sortedMap = new Map([...map.entries()].sort());
	sortedMap.forEach(function(value, key) {
		if(key != "undefined") {
			var newKey = key;
			if(key[0] === '0') {
				newKey = key.substr(1, 3);
			}
			problemRating.push(newKey);
			problemCount.push(value);
		}
	});
	solvedProblems = set.size;
}


// This snippet generates the doughnut chart based on problem tags
var tag = [];
var tagCount = [];
app.get("/problemsTagDistribution", function(req, res) {
	getProblemsTagDistribution();
	res.redirect("/verdictDistribution");
});

function getProblemsTagDistribution() {
	tag = [], tagCount = [];
	var map = new Map();
	var set = new Set();
	data["result"].forEach(function(problem) {
		if(problem.verdict === "OK") {
			var problemid = problem.id;
			if(!set.has(problemid)) {
				problem["problem"]["tags"].forEach(function(curTag) {
					if(map.has(curTag)) {
						map.set(curTag, map.get(curTag) + 1);
					}
					else {
						map.set(curTag, 1);
					}
				});
				set.add(problemid);
			}
		}
	});
	sortedMap = new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
	sortedMap.forEach(function(value, key) {
		tag.push(key);
		tagCount.push(value);
	});
}


// This snippet generates the pie chart based on solution verdicts
var verdict = [];
var verdictCount = [];
app.get("/verdictDistribution", function(req, res) {
	getVerdictDistribution();
	res.redirect("/displayStats");
});

function getVerdictDistribution() {
	verdict = [], verdictCount = [];
	var map = new Map();
	var count = 0;
	data["result"].forEach(function(problem) {
		var ver = problem["verdict"];
		if(!map.has(ver)) {
			if(count === 10) {
				return;
			}
			map.set(ver, 0);
			count ++;
		}
		map.set(ver, map.get(ver) + 1);
	});
	sortedMap = new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
	sortedMap.forEach(function(value, key) {
		if(value === 0) {
			return;
		}
		verdict.push(key);
		verdictCount.push(value);
	});
}

 
// This snippet displays all the data
app.get("/displayStats", function(req, res) {
	res.render("stats", {title : String(handle) + " stats",
						 solvedProblems : solvedProblems, contestCount : contestCount,
						 handle : handle, curRating : curRating, maxRating : maxRating,
						 curTier : getTier(curRating), maxTier : getTier(maxRating),
						 contestid : contestid, userRating : userRating,
						 problemRating : problemRating, problemCount : problemCount,
						 tag : tag, tagCount : tagCount,
						 verdict : verdict, verdictCount : verdictCount});
});



// Code for compare feature -

// Rendering the search page
app.get("/compare", function(req, res) {
	res.render("compare", {title: "Compare"});
});


// This snippet retrieves all the handles
var allHandles;
app.get("/getHandles", function(req, res) {
	allHandles = req.query.handles;
	res.redirect("/processHandles");
});
		

// 	This snippet verfies the searched handles
var curData;
var handlesList = [];
var data1 = new Map(), data2 = new Map();
app.get("/processHandles", function(req, res) {
	handlesList = [], curData = [];
	data1 = new Map(), data2 = new Map();
	var set = new Set();
	var queryString = "";
	allHandles.forEach(function(thisHandle) {var handlesList = [];
		queryString = queryString + thisHandle + ';';
	});
	var url = "https://codeforces.com/api/user.info?handles=" + queryString;
	request(url, function(error, response, body) {
		if(!error && response.statusCode == 200) {
			var temp = JSON.parse(body);
			temp["result"].forEach(function(user) {
				var curHandle = user.handle;
				if(set.has(curHandle)) {
					return;
				}
				set.add(curHandle);
				handlesList.push(curHandle);
			});
			res.redirect("/processData1");
		}
		else {
			res.render("error", {title: "Error", message: "user not found"});
		}
	});
});


// This snipped finds contest count, best rank, max rating and cur rating
app.get("/processData1", function(req, res) {
	var idx = 0;
	handlesList.forEach(function(curHandle) {
		var url = "https://codeforces.com/api/user.rating?handle=" + curHandle;
		request(url, function(error, response, body) {
			idx ++;
			curData = JSON.parse(body);
			getData1(curHandle);
			if(idx === handlesList.length) {
				res.redirect("/processData2");
			}
		});
	});
});

function getData1(curHandle) {
	var curContests = 0, curBestRank = 0, curCurrentRating = 0, curBestRating = 0;
	curData["result"].forEach(function(contest) {
		curContests ++;
		if(curBestRank === 0) {
			curBestRank = contest.rank;
		} 
		else {
			curBestRank = Math.min(curBestRank, contest.rank);
		}
		curCurrentRating = contest.newRating;
		curBestRating = Math.max(curBestRating, curCurrentRating);
	});
	data1.set(curHandle, {contests: curContests, bestRank: curBestRank, currentRating: curCurrentRating, bestRating: curBestRating});
}


// This snippet finds solved problems count and number of submissions
app.get("/processData2", function(req, res) {
	var idx = 0;
	handlesList.forEach(function(curHandle) {
		var url = "https://codeforces.com/api/user.status?handle=" + curHandle;
		request(url, function(error, response, body) {
			idx ++;
			curData = JSON.parse(body);
			getData2(curHandle);
			if(idx === handlesList.length) {
				res.redirect("/compaison");
			}
		});
	});
});

function getData2(curHandle) {
	var problemSet = new Set();
	var curProblems = 0, curAttempts = 0;
	curData["result"].forEach(function(problem) {
		curAttempts ++;
		var curProblem = String(problem.contestId) + problem.problem.index;
		if(problemSet.has(curProblem)) {
			return;
		}
		if(problem.verdict === "OK") {
			problemSet.add(curProblem);
			curProblems ++;
		}
	});
	data2.set(curHandle, {problems: curProblems, attempts: curAttempts});
}


// This snippet combines the two data sets and displays it
var userData = [];
app.get("/compaison", function(req, res) {
	mergeData();
	if(userData.length < 2) {
		res.render("error", {title: "Error", message: "Minimum 2 handles required"});
	}
	else {
		res.render("statscompare", {title: "Compare", userData: userData});	
	}
})

function mergeData() {
	userData = [];
	data1.forEach(function(value, key) {
		userData.push({handle: key, curRating: value.currentRating, curTier: getTier(value.currentRating), 
					   maxRating: value.bestRating, maxTier: getTier(value.bestRating),
					   contests: value.contests, bestRank: value.bestRank,
					   problems: data2.get(key).problems, attempts: data2.get(key).attempts});
	});
}


// Invalid path handling
app.get("*", function(req, res) {
	res.render("error", {title : "Error", message: "Page not found"});
});


// helper function
function getTier(cur) {
	if(cur === 0) {
		return "#000000";
	}
	if(cur < 1200) {
		return "#808080";
	}
	if(cur < 1400) {
		return "#008000";
	}
	if(cur < 1600) {
		return "#5BADD4";
	}
	if(cur < 1900) {
		return "#0000FF";
	}
	if(cur < 2100) {
		return "#800080";
	}
	if(cur < 2400) {
		return "#FFA500";
	}
	return "#FF0000";
}


app.listen(process.env.PORT || 3000, function(req, res) {
	console.log("We are live...");
});
