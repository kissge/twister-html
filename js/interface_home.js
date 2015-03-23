// interface_home.js
// 2013 Lucas Leal, Miguel Freitas
//
// Specific interface functions for home.html

var promotedPostsOnly = false;

//***********************************************
//******************* DECLARATIONS **************
//***********************************************
var InterfaceFunctions = function()
{
    //faço os binds no init
    this.init = function()
    {
        $( ".wrapper .postboard-news").click(function() {
            var newPosts = parseInt($(".userMenu .menu-news").text());
            if (!newPosts)
                newPosts = postsPerRefresh;
            requestTimelineUpdate('pending',newPosts,followingUsers,promotedPostsOnly);
        });

        // Add refresh posts for home link in menu
        $( ".userMenu-home.current a").click(function() {
            var newPosts = parseInt($(".userMenu .menu-news").text());
            if (!newPosts)
                newPosts = postsPerRefresh;
            requestTimelineUpdate('pending',newPosts,followingUsers,promotedPostsOnly);
        });

        $( ".promoted-posts-only").click(function() {
            promotedPostsOnly = !promotedPostsOnly;

            timelineChangedUser();
            $.MAL.getStreamPostsParent().empty();
            requestTimelineUpdate("latestFirstTime",postsPerRefresh,followingUsers,promotedPostsOnly);
        });

        initInterfaceCommon();
        initUserSearch();
        initInterfaceDirectMsg();

        initUser(initHome);
        initHashWatching();
    };

    function initHome(cbFunc, cbArg) {
        checkNetworkStatusAndAskRedirect();

        //$("span.screen-name").text('@' + user);
        var $miniProfile = $(".mini-profile");
        if(!defaultScreenName)
        {
            $(".userMenu-profile > a").text(polyglot.t("Login"));
            $(".userMenu-profile > a").attr("href","login.html");
            $(".post-area-new > textarea").attr("placeholder",polyglot.t("You have to log in to post messages."));
            $(".post-area-new > textarea").attr("disabled","true");
            $miniProfile.find(".mini-profile-name").text("guest");
            $miniProfile.find(".posts-count").text("0");
            $miniProfile.find(".following-count").text("0");
            $miniProfile.find(".followers-count").text("0");
            $miniProfile.find("a.open-following-page").attr("href","#");
            $miniProfile.find("a.open-following-page").bind("click", function()
            { alert(polyglot.t("You are not following anyone because you are not logged in."))} );
            $miniProfile.find("a.open-followers").bind("click", function()
            { alert(polyglot.t("You don't have any followers because you are not logged in."))} );
            $(".dropdown-menu-following").attr("href","#");
            $(".dropdown-menu-following").bind("click", function()
            { alert(polyglot.t("You are not following anyone because you are not logged in."))} );
            twisterRpc("gettrendinghashtags", [10],
                                function(args, ret) {
                                    for( var i = 0; i < ret.length; i++ ) {

                                       var $li = $("<li>");
                                       var hashtagLinkTemplate = $("#hashtag-link-template").clone(true);
                                       hashtagLinkTemplate.removeAttr("id");
                                       hashtagLinkTemplate.attr("href",$.MAL.hashtagUrl(ret[i]));
                                       hashtagLinkTemplate.text("#"+ret[i]);
                                       $li.append(hashtagLinkTemplate);
                                       $(".toptrends-list").append($li);
                                    }
                                }, {},
                                function(args, ret) {
                                   console.log("Error with gettrendinghashtags. Older twister daemon?");
                                }, {});
        }
        else
        {
            $miniProfile.find("a.mini-profile-name").attr("href",$.MAL.userUrl(defaultScreenName));
            $miniProfile.find("a.open-profile-modal").attr("href",$.MAL.userUrl(defaultScreenName));
            $miniProfile.find(".mini-profile-name").text(defaultScreenName);
            getFullname( defaultScreenName, $miniProfile.find(".mini-profile-name") );
            getAvatar( defaultScreenName, $miniProfile.find(".mini-profile-photo").find("img") );
            // add avatar in postboard-top
            getAvatar( defaultScreenName, $("#postboard-top").find("img") );
            getPostsCount( defaultScreenName,  $miniProfile.find(".posts-count") );
            getFollowers( defaultScreenName, $miniProfile.find(".followers-count") );

            loadFollowing( function(args) {
                     $(".mini-profile .following-count").text(followingUsers.length-1);
                     requestLastHave();
                     setInterval("requestLastHave()", 1000);
                     initMentionsCount();
                     initDMsCount();
                     requestTimelineUpdate("latestFirstTime",postsPerRefresh,followingUsers,promotedPostsOnly);

                     // install scrollbottom handler to load more posts as needed
                     $(window).scroll(function(){
                        if  ($(window).scrollTop() >= $(document).height() - $(window).height() - 20){
                            if( timelineLoaded ) {
                                requestTimelineUpdate("older", postsPerRefresh, followingUsers, promotedPostsOnly);
                            }
                        }
                     });

                     twisterFollowingO = TwisterFollowing(defaultScreenName);

                     setTimeout("getRandomFollowSuggestion(processSuggestion)", 1000);
                     setTimeout("getRandomFollowSuggestion(processSuggestion)", 1000);
                     setTimeout("getRandomFollowSuggestion(processSuggestion)", 1000);

                     twisterRpc("gettrendinghashtags", [10],
                                function(args, ret) {
                                    for( var i = 0; i < ret.length; i++ ) {

                                       var $li = $("<li>");
                                       var hashtagLinkTemplate = $("#hashtag-link-template").clone(true);
                                       hashtagLinkTemplate.removeAttr("id");
                                       hashtagLinkTemplate.attr("href",$.MAL.hashtagUrl(ret[i]));
                                       hashtagLinkTemplate.text("#"+ret[i]);
                                       $li.append(hashtagLinkTemplate);
                                       $(".toptrends-list").append($li);
                                    }
                                }, {},
                                function(args, ret) {
                                   console.log("Error with gettrendinghashtags. Older twister daemon?");
                                }, {});

                     if( args.cbFunc )
                        args.cbFunc(args.cbArg);
                 }, {cbFunc:cbFunc, cbArg:cbArg});

            $(window)
                .on("eventFollow", function(e, user) {
                    $(".following-count").text(followingUsers.length-1);
                    setTimeout('requestTimelineUpdate("latest",postsPerRefresh,["'+user+'"],promotedPostsOnly)', 1000);
                })
                .on("eventUnfollow", function(e, user) {
                    $(".following-count").text(followingUsers.length-1);
                    $('.wrapper .postboard .post').each( function() {
                        if (($(this).find('[data-screen-name="'+user+'"]').length && !$(this).find(".post-retransmited-by").text())
                        || $(this).find(".post-retransmited-by").text() == '@'+user)
                            $( this ).remove();
                    });
                });
        }
    }
};

//***********************************************
//******************* INIT **************
//***********************************************
var interfaceFunctions = new InterfaceFunctions;
$( document ).ready( interfaceFunctions.init );

//função no window que fixa o header das postagens
function fixDiv()
{
  var $cache = $('.postboard h2');
  if ($(window).scrollTop() > 26)
    $cache.addClass( "fixed" );
  else
    $cache.removeClass( "fixed" );
}
$(window).scroll(fixDiv);
