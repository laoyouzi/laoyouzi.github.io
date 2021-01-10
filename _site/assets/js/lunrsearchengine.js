
var documents = [{
    "id": 0,
    "url": "http://localhost:4000/404.html",
    "title": "404",
    "body": "404 Page not found!Please use the search bar from the bottom left or visit our homepage! "
    }, {
    "id": 1,
    "url": "http://localhost:4000/about",
    "title": "Hey, I’m an Chinese software engineer. Just do it",
    "body": "My favourites::  Vim Ruby Java React"
    }, {
    "id": 2,
    "url": "http://localhost:4000/categories",
    "title": "Categories",
    "body": ""
    }, {
    "id": 3,
    "url": "http://localhost:4000/",
    "title": "Home",
    "body": "                                                      2021年的目标              :       2021年给自己定一个目标，目的在于不断的学习，分享自己的技术。:                                                                               laoyouzi                 10 Jan 2021                                                                                  GraphQL on Rails——避免N+1问题                         1 2 3 4 5                      :       本文已获得原作者（Dmitry Tsepelev）和 Evil Martians 授权许可进行翻译。原文重点介绍了如何在 GraphQL 的世界里避免 N + 1 问题——以六种不同的方案。“六瞳之中莲花开放，七尺红绫击排空巨浪”。:                                                                               laoyouzi                 15 Dec 2020                                "
    }, {
    "id": 4,
    "url": "http://localhost:4000/robots.txt",
    "title": "",
    "body": "      Sitemap: {{ “sitemap. xml”   absolute_url }}   "
    }, {
    "id": 5,
    "url": "http://localhost:4000/2021/01/plan/",
    "title": "2021年的目标",
    "body": "2021/01/10 - 2021年给自己定一个目标，目的在于不断的学习，分享自己的技术。:  写12篇技术博客 读6本书 开发一个自己喜欢的东西 完成人生中的大事"
    }, {
    "id": 6,
    "url": "http://localhost:4000/2020/12/how-to-graphql-no-n-plus-one/",
    "title": "GraphQL on Rails——避免N+1问题",
    "body": "2020/12/15 - 本文已获得原作者（Dmitry Tsepelev）和 Evil Martians 授权许可进行翻译。原文重点介绍了如何在 GraphQL 的世界里避免 N + 1 问题——以六种不同的方案。“六瞳之中莲花开放，七尺红绫击排空巨浪”。  原文链接：How to GraphQL with Ruby, Rails, Active Record, and no N+1 作者：Dmitry Tsepelev 站点：Evil Martians ——位于纽约和俄罗斯的 Ruby on Rails 开发人员博客。 它发布了许多优秀的文章，并且是不少 gem 的赞助商。【正文如下】 引言: 你工作在一个成熟的 Web 应用程序上，其被拆分为清晰的后端和前端。服务端代码用 Ruby 写成，主要负责把 HTTP 请求传递到 SQL 语句内（在 ORM 的帮助下），有丰富且很好文档的 API。你选择了 GraphQL 而非 REST 来简化端点，但数据库对于额外的查询并不满意。经过大量搜索后，你从 一个使用 GraphQL 的 Rubyist 那里发现了一个有关对抗 N + 1 问题的详尽指南……诺，它来了！ GraphQL可以在仅后端的 Rails 应用程序中创造奇迹，为你的客户端（无论是前端框架还是其他 API 使用者）提供一个单一端点，以获取他们可能需要的任何形式和大小的数据。 不过存在一个问题，一个大问题。N + 1 的大问题。 因为要加载的关联数据总是在 runtime 时才确定的，关于查询数据库很难做到智能化。 要么你可以接受令人难过的现实：一个处理父记录的 query + 针对每个关联记录的 query（所以是“N+1”，尽管严格的说应该是“1+N”）——要么你可以使用可爱的 SQL 语句一次性加载所有有关记录。但如果你有一个丰富的 schema，而其正是切换到 GraphQL 的原因，预加载会对数据库造成更大的压力，乃至超过 N+1 的压力。幸运的是，在 Ruby-GraphQL 世界里有一些工具，让我们对于加载什么，何时加载以及如何加载，有了更多的选择，也更智能化。 It’s always better to have an example: 让我们勾画一个实例，它有简单的 schema，作为简单的 Twitter 克隆应用。这里的目标不是要做到原生那样，而是能立即跟 types 关联起来。它们是Tweet，User和Viewer。Viewer是查看其他用户的 tweet 的用户。我们为“current user”创建一个单独的 type，因为它可以暴露出“general”用户所不可访问的那些属性。 class Types::BaseObject &lt; GraphQL::Schema::Object def current_user  context[:current_user] endendclass Types::Tweet &lt; Types::BaseObject field :content, String, null: false field :author, Types::User, null: falseendclass Types::User &lt; Types::BaseObject field :nickname, String, null: falseendclass Types::Viewer &lt; Types::BaseObject field :feed, [Types::Tweet], null: false def feed  # In this case, FeedBuilder is a query object  # that returns a Tweet relation based on passed params  FeedBuilder. for(current_user) endendclass Types::Query &lt; Types::BaseObject field :viewer, Types::Viewer, null: true, resolver_method: :current_userendclass GraphqlSchema &lt; GraphQL::Schema query Types::Queryend我也准备了一个 gist，在单个文件内包含了整个 Rails “应用”。你无法运行它，但它的功能足以通过我们包含的用于比较本文中讨论的不同优化方法的 specs。要查看代码和运行 specs，你可以在 terminal 中的任何临时目录下运行如下命令： curl  https://gist. githubusercontent. com/DmitryTsepelev/d0d4f52b1d0a0f6acf3c5894b11a52ca/raw/cba338548f3f87c165fc7ec07eb2c5b55120f7a2/2_demo. rb  &gt; demo. rbcreatedb nplusonedb # To create a PostgreSQL test database, requires Postgres installationrspec demo. rb # to run tests that compare different N+1-fighting techniques这段代码目前包含一个 N + 1 问题。查询含 tweet 作者昵称的 feed 将会对tweets表触发一个单独的 query，以及在users表中的 N 个 query。 { query {  viewer {   feed {    content    author {     nickname    }   }  } }}Solution #0: Load all the associations!: 让我们从清理代码并把 feed 的加载解构到一个 resolver 开始——resolver 是一个特别的 class，为数据库查询逻辑的一个概述。 class Resolvers::FeedResolver &lt; Resolvers::BaseResolver type [Types::Tweet], null: false def resolve  FeedBuilder. for(current_user) endendclass Types::Viewer &lt; Types::BaseObject field :feed, resolver: Resolvers::FeedResolverend如果你感兴趣，下面是我们FeedBuilder模块的定义，抽象了一些 Active Record 调用： module FeedBuilder module_function def for(user)  Tweet. where(author: user. followed_users)     . order(created_at: :desc)     . limit(10) endend把逻辑抽出来放到 resolver 使得我们能够创建替代的 resolver 并实时交换它们以比较结果。下面是一个通过预加载所有关联记录来解决 N+1 问题的 resolver： class Resolvers::FeedResolverPreload &lt; Resolvers::BaseResolver type [Types::Tweet], null: false def resolve  FeedBuilder. for(current_user). includes(:author) # Use AR eager loading magic endend这个解决办法很容易想到的，但不那么理想：我们总是会做一次额外的 SQL 查询来预加载 users，不管什么情况，甚至我们只请求 tweets 而不关心其作者时也如此（我知道，这难以想象，但假设一下匿名数据挖掘操作）。 还有，我们必须在顶层（在Query type 或属于它的 resolver 内部）就定义关联记录的列表。当一个新的嵌套字段出现在 graph 的深处时，很容易忘记把新的关联关系添加到列表里。 不过，当你知晓客户端大多情况下就是要求作者数据时，这个方案就很有用了（比如，当你掌控前端代码时）。 Solution #1: Lookaheads: 在处理 query 时，GraphQL 的 execution engine 知道哪些数据被请求，所以在运行时找到哪些数据应该被加载是可以做到的。graphql-ruby gem 自带一个可爱的 Lookahead 特性，可以提前告知我们某个特定字段是否被请求。让我们在一个单独的 resolver 中试试： class Resolvers::FeedResolverLookahead &lt; Resolvers::BaseResolver type [Types::Tweet], null: false extras [:lookahead] def resolve(lookahead:)  FeedBuilder. for(current_user)        . merge(relation_with_includes(lookahead)) end private def relation_with_includes(lookahead)  # . selects?(:author) returns true when author field is requested  return Tweet. all unless lookahead. selects?(:author)  Tweet. includes(:author) endend此处，我们仅当客户端要求author字段时才在users表内进行查询。这个方案仅仅在关联记录最小且没有嵌套时才能很好地工作。如果我们有着更复杂的数据 model，其中 users 有 avatars 和其所喜欢的 tweets，那么 resolver 很快就会脱离现实了： class Resolvers::FeedResolverLookahead &lt; Resolvers::BaseResolver type [Types::Tweet], null: false extras [:lookahead] def resolve(lookahead:)  scope =   Tweet. where(user: User. followed_by(current_user))      . order(created_at: :desc)      . limit(10)  scope = with_author(scope, lookahead) if lookahead. selects?(:author)  scope = with_liked_by(scope, lookahead) if lookahead. selects?(:liked_by)  scope end private def with_author(scope, lookahead)  if lookahead. selection(:author). selects?(:avatar)   scope. includes(user: :avatar_attachment)  else   scope. includes(:user)  end end def with_liked_by(scope, lookahead)  if lookahead. selection(:liked_by). selects?(:user)   if lookahead. selection(:liked_by). selection(:user). selects?(:avatar)    scope. includes(likes: { user: :avatar_attachment })   else    scope. includes(likes: :user)   end  else   scope. includes(:likes)  end endend没错，这一点都不优雅！有没有一种方式仅当关联记录被访问时才加载它们？Lazy preloading 就可以！ Solution #2: Lazy preloading (by Evil Martians): 在 Evil Martian 的一些同事帮助下，我写了一个名为 ar_lazy_preload 的小 gem，让我们回退到预加载方案，但无需任何额外成本即可使其变得更智能。它仅在关联对象被第一次访问后，用一个单独的请求来获取所有关联对象。当然，它也可以在 GraphQL 示例之外使用，并且在 REST API 中或在构建服务端渲染视图时非常方便。你只需把gem  ar_lazy_preload 添加到 Gemfile，bundle install，然后就可以像这样来写 resolver 了： class Resolvers::FeedResolverLazyPreload &lt; Resolvers::BaseResolver type [Types::Tweet], null: false def resolve  FeedBuilder. for(current_user). lazy_preload(:author) endend这个 gem 是在 懒惰 中创建出来的，所以如果你甚至都懒于敲. lazy_preload这点代码的话，可以在全局针对所有 Active Record 调用都启用它，只要在配置中添加下面这行： ArLazyPreload. config. auto_preload = true然而，这个方案有一些不足：  我们最终引入了第一个外部依赖； 我们对所做的 query 请求无法有太多控制，将难以对其进行自定义； 如果 lazy preloading 被打开，我们仍然不得不在顶层列举所有可能的关联数据； 如果一张表从两个地方被引用，我们就将请求数据库两次。还有其他我们能做的么？ Solution #3: graphql-ruby lazy resolvers: 让我们在 Ruby 应用中得以用上 GraphQL 的graphql-ruby gem 带来了一种使用 lazy execution 的方式：  代之以返回数据，你可以返回一个特别的 lazy object（该 object 会记得它所代替的数据）； 当一个 lazy value 从 resolver 被返回时，execution engine 停止当前 subtree 的进一步处理； 当所有非 lazy values 都被 resolved 时，execution engine 再要求处理 lazy object； lazy object 加载其所需处理的数据，并返回给每个 lazy object。这需要花一点时间来理解，所以我们来一步步实现一个 lazy resolver。首先，我们可以重用还未加入关联的初始FeedResolver： class Resolvers::FeedResolver &lt; Resolvers::BaseResolver type [Types::Tweet], null: false def resolve  FeedBuilder. for(current_user) endend然后，我们将从Tweet type 返回一个 lazy object。我们需要传递 user 的 ID 和 query context，因为将用它来存储要加载的 ID 列表： class Types::Tweet &lt; Types::BaseObject field :content, String, null: false field :author, Types::User, null: false def author  Resolvers::LazyUserResolver. new(context, object. user_id) endend每次一个新 object 被初始化，我们都添加一个待处理的 user ID 到 query context，并且，当#user被第一次调用时，我们做一次单独的数据库请求以得到所有所需的 users。之后，我们就可以为所有 lazy fields 填充 user 的数据了。下面是如何实现它的代码： class Resolvers::LazyUserResolver def initialize(context, user_id)  @user_id = user_id  @lazy_state = context[:lazy_user_resolver] ||= {   user_ids: Set. new,   users_cache: nil  }  @lazy_state[:user_ids] &lt;&lt; user_id end def user  users_cache[@user_id] end private def users_cache  @lazy_state[:users_cache] ||=   begin    user_ids = @lazy_state[:user_ids]. to_a    @lazy_state[:user_ids]. clear    User. where(id: user_ids). index_by(&amp;:id)   end endend想知道 execution engine 是如何区分出常规 object 与 lazy object 之间的不同吗？我们将在 schema 中定义 lazy resolver： class GraphqlSchema &lt; GraphQL::Schema lazy_resolve(Resolvers::LazyUserResolver, :user) query Types::Queryend它告诉 execution engine，当Resolvers::LazyUserResolver object 被返回时停止处理 users，并仅当所有其他非 lazy fields 被 resolved 之后才回来处理它。 这样一切运转正常，但是你可能经常需要重复很多样板代码。此外，当我们的 lazy resolvers 需要处理其他 lazy object 时，代码会变得相当复杂。幸运的是，有一个不太冗长的替代方案。 Solution #4: Batch loading: 来自 Shopify 的 graphql-batch 使用了与graphql-ruby相同的 lazy 机制，但隐藏了那些丑陋的样板代码部分。我们所需做的就是继承GraphQL::Batch::Loader并实现perform方法： class RecordLoader &lt; GraphQL::Batch::Loader def initialize(model)  @model = model end def perform(ids)  @model. where(id: ids). each { |record| fulfill(record. id, record) }  ids. each { |id| fulfill(id, nil) unless fulfilled?(id) } endend这个 loader（取自于其官方 repo 的 examples 目录）所期望的是 initializer 中的 model class（以决定数据将从哪里被加载）。#perform方法负责获取数据，#fulfill方法用来把一个 key 跟加载的数据关联起来。 Batch loader 的用法和 lazy 版本是类似的。我们传入User到 initializer，user 的 ID 用来懒式加载（该 ID 将被用做 key 来获取关联的 user）： class Types::Tweet &lt; Types::BaseObject field :content, String, null: false field :author, Types::User, null: false def author  RecordLoader. for(::User). load(object. author_id) endend跟通常一样，我们需要在 schema 中打开 lazy loading： class GraphqlSchema &lt; GraphQL::Schema query Types::Query use GraphQL::Batchend这是如何工作的呢？当use GraphQL::Batch被添加到 schema 时，Promise#sync就被注册了，从而做到懒式 resolve（其在幕后使用了 Promise. rb）。当#load方法在一个继承自GraphQL::Batch::Loader的 class 上被调用时，它返回一个Promise object——这就是为什么 execution engine 把其视为一个 lazy value。 这个方案有一个很有用的边际效应——你可用如下方式进行链式加载： def product_image(id:) RecordLoader. for(Product). load(id). then do |product|  RecordLoader. for(Image). load(product. image_id) endendSolution #5: Better schema design: 但甚至即使使用了上述的所有高级技术之后，还是可能最终出现 N+1 问题。想象一下，我们正在加上一个管理面板，在其中可以看到一个 users 列表。当一个 user 被选中时，用户信息弹窗弹出，你可以看到他的 followers 列表。在 GraphQL 世界里，数据将从其所属的地方被访问，我们会做类似如下的事情： class Types::User &lt; Types::BaseObject field :nickname, String, null: false field :followers, [User], null: false do  argument :limit, Integer, required: true, default_value: 2  argument :cursor, Integer, required: false end def followers(limit:, cursor: nil)  scope = object. followers. order(id: :desc). limit(limit)  scope = scope. where( id &lt; cursor , cursor) if cursor  scope endendclass Types::Query &lt; Types::BaseObject field :users, [User], null: false field :user, User, null: true do  argument :user_id, ID, required: true end def users  ::User. all end def user(user_id:)  ::User. find(user_id) endend用户列表可使用如下 query 来获取： query GetUsers($limit: Int) { users(limit: $limit) {  nickname }}follow 一个特定用户的用户列表可以像下面这样来加载： query GetUser($userId: ID, $followersLimit: Int, $followersCursor: ID) { user(userId: $userId) {  followers(limit: $limit, cursor: $followersCursor) {   nickname  } }}当有人试图加载一个用户列表，且在同一个 query 中包含其 followers 时，问题就出现了： query GetUsersWithFollowers( $limit: Int $followersLimit: Int $followersCursor: ID) { users(limit: $limit) {  nickname  followers(limit: $limit, cursor: $followersCursor) {   nickname  } }}这个场景里，我们根本无法摆脱 N+1：我们不得不对每一个 user 都做一次数据库调用，由于分页指针的缘故。要处理这种情况，我们可以使用不那么优雅的方案，把分页移至顶层： class Types::Query &lt; Types::BaseObject field :users, [User], null: false field :user, User, null: true do  argument :user_id, ID, required: true end field :user_followers, [User], null: false do  argument :limit, Integer, required: true, default_value: 2  argument :cursor, Integer, required: false end def users  ::User. all end def user(user_id:)  ::User. find(user_id) end def user_followers(user_id:, limit:, cursor: nil)  scope = UserConnection. where(user_id: user_id). order(user_id: :desc). limit(limit)  scope = scope. where( user_id &lt; cursor , cursor) if cursor  scope endend这个设计仍然能够加载 users 及其 followers，但事实证明，我们把服务端的 N+1 变成了 N+1 个 HTTP 请求。该解决方案看起来很好，但是嘿伙计，我们热爱 GraphQL 的 logical schema structure 呀！我们期望从User type 获取到 followers！ 没问题。我们可以在多个 users 被请求时限制对followers field 的获取。当其发生时我们来返回一个 error： class Types::Query &lt; Types::BaseObject field :users, [User], null: false, extras: [:lookahead] field :user, User, null: true do  argument :user_id, ID, required: true end def users(lookahead:)  if lookahead. selects?(:followers)   raise GraphQL::ExecutionError,  followers can be accessed in singular association only   end  ::User. all end def user(user_id:)  ::User. find(user_id) endend使用这个 schema，获取单个 user 的 followers 依旧是可以的，并且我们完全阻止了所不期望的场景。别忘了在文档中注明这点！ 就到这里了！你已经到达了本指南的结尾，现在你至少有六种不同方案可以在 Ruby-GrapgQL 代码中试用，以使应用程序摆脱 N + 1 问题。 也别忘了看看我们博客上其他有关 GraphQL 和 N+1 问题的文章：从对初学者友好且带代码的关于以 React 前端构建 Rails GraphQL 应用的教程（三个部分，从这里开始），到更加特定用例的 using GraphQL with Active Storage Direct Upload，处理来自 Apollo 的 persisted queries，以及graphql-ruby中的 reporting non-nullable violations。 我们也有一些 gems 让你在“经典” Rails 应用中处理 N+1 问题更容易，和一些相关文章：Squash N+1 queries early with n_plus_one_control test matchers for Ruby and Rails 和 Fighting the Hydra of N+1 queries。 "
    }];

var idx = lunr(function () {
    this.ref('id')
    this.field('title')
    this.field('body')

    documents.forEach(function (doc) {
        this.add(doc)
    }, this)
});
function lunr_search(term) {
    document.getElementById('lunrsearchresults').innerHTML = '<ul></ul>';
    if(term) {
        document.getElementById('lunrsearchresults').innerHTML = "<p>Search results for '" + term + "'</p>" + document.getElementById('lunrsearchresults').innerHTML;
        //put results on the screen.
        var results = idx.search(term);
        if(results.length>0){
            //console.log(idx.search(term));
            //if results
            for (var i = 0; i < results.length; i++) {
                // more statements
                var ref = results[i]['ref'];
                var url = documents[ref]['url'];
                var title = documents[ref]['title'];
                var body = documents[ref]['body'].substring(0,160)+'...';
                document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML + "<li class='lunrsearchresult'><a href='" + url + "'><span class='title'>" + title + "</span><span class='body'>"+ body +"</span><span class='url'>"+ url +"</span></a></li>";
            }
        } else {
            document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = "<li class='lunrsearchresult'>No results found...</li>";
        }
    }
    return false;
}

function lunr_search(term) {
    $('#lunrsearchresults').show( 400 );
    $( "body" ).addClass( "modal-open" );
    
    document.getElementById('lunrsearchresults').innerHTML = '<div id="resultsmodal" class="modal fade show d-block"  tabindex="-1" role="dialog" aria-labelledby="resultsmodal"> <div class="modal-dialog shadow" role="document"> <div class="modal-content"> <div class="modal-header" id="modtit"> <button type="button" class="close" id="btnx" data-dismiss="modal" aria-label="Close"> &times; </button> </div> <div class="modal-body"> <ul class="mb-0"> </ul>    </div> <div class="modal-footer"><button id="btnx" type="button" class="btn btn-primary btn-sm" data-dismiss="modal">Close</button></div></div> </div></div>';
    if(term) {
        document.getElementById('modtit').innerHTML = "<h5 class='modal-title'>Search results for '" + term + "'</h5>" + document.getElementById('modtit').innerHTML;
        //put results on the screen.
        var results = idx.search(term);
        if(results.length>0){
            //console.log(idx.search(term));
            //if results
            for (var i = 0; i < results.length; i++) {
                // more statements
                var ref = results[i]['ref'];
                var url = documents[ref]['url'];
                var title = documents[ref]['title'];
                var body = documents[ref]['body'].substring(0,160)+'...';
                document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML + "<li class='lunrsearchresult'><a href='" + url + "'><span class='title'>" + title + "</span><small><span class='body'>"+ body +"</span><span class='url'>"+ url +"</span></small></a></li>";
            }
        } else {
            document.querySelectorAll('#lunrsearchresults ul')[0].innerHTML = "<li class='lunrsearchresult'>Sorry, no results found. Close & try a different search!</li>";
        }
    }
    return false;
}
    
$(function() {
    $("#lunrsearchresults").on('click', '#btnx', function () {
        $('#lunrsearchresults').hide( 5 );
        $( "body" ).removeClass( "modal-open" );
    });
});