let gulp = require('gulp'); //引入gulp模块
let $ = require('gulp-load-plugins')(); //引入gulp加载的所有插件（需要本地安装依赖所用到的插件）
const pkg = require('./package.json');
const runsequence = require("run-sequence");   // 按顺序执行
const proxy = require('http-proxy-middleware');    //本地数据处理跨域
const spritesmith = require("gulp.spritesmith");    // 完成精灵图的合并


let path = {filename:'all.js',basename:'base',extname:'js'}
const banner = [
        '/*!',
        ' * wap v<%= pkg.version %> ',
        ' * Copyright <%= new Date().getFullYear() %> WangXiuFang, Inc.',
        ' * Licensed under the <%= pkg.license %> license',
        ' */',
        ''
    ].join('\n');

const build = {
    basePath: "./build/",
    js: "./build/**/js/",
    css: "./build/**/css/",
    imgs: "./build/**/imgs"
}

const src = {
    basePath: "./src/",
    css: "./src/**/css/",
    js: "./src/**/js/",
    imgs: "./src/**/imgs/",
    html: "./src/**/"

}
//开启一个任务（js:任务名称），用于对JS文件的处理
gulp.task('js', function () {
    //加上return之后，返回一个stream（gulp.src对象），目的为了确保task在执行的时候能够按照顺序进行，并依次完成，然后注入
    return gulp.src(src.js+"*.js")  //gulp.src() 指定源文件  可以数组的形式gulp.src(['./src/js/base.js', './src/js/index.js'])
        .pipe($.babel()) //将es6代码编译成es2015
        // .pipe($.concat("all.js")) //合并js代码
        .pipe(gulp.dest(build.basePath)) //将合并后的js代码输出到build/js目录下
        .pipe($.uglify()) //进行压缩JS文件
        .pipe($.header(banner, { pkg : pkg } ))     // 给生成文件统一 添加注释
        .pipe($.rename(function (path) { //修改压缩后的文件名称，防止覆盖上边的输出
            // {filename:'all.js',basename:'base',extname:'js'}
            path.basename += '.min'; // 在basename的基础上加上min，表示此文件为同名称文件的压缩版文件
        }))
        .pipe(gulp.dest(build.basePath)) //将压缩后的文件进行输出到指定目录
        .pipe($.connect.reload())           // 内容改变从新加载文件
        .pipe($.notify("完成：<%= file.relative %>!"))     // 执行操作完成后添加通知信息

}); 
 
//开启一个任务（css:任务名称），对less文件处理，并将less文件处理后变成css文件
gulp.task('css',function () {
    return gulp.src(src.css+"*.less")
        .pipe($.less()) //将less文件编译成css文件
        .pipe($.autoprefixer({   // 添加样式前缀
            browsers: ['last 20 versions','last 3 Explorer versions','Firefox >= 20'],
            cascade: true, //是否美化属性值 默认：true 像这样：
            //-webkit-transform: rotate(45deg);
            //        transform: rotate(45deg);
            remove:true //是否去掉不必要的前缀 默认：true 
        }))
        // .pipe($.concat('all.css')) //合并编译后的css文件，并指定名称为all.css
        .pipe($.header(banner, { pkg : pkg } ))  // 给生成文件统一 添加注释
        .pipe(gulp.dest(build.basePath)) //输出合并后的非压缩版all.css文件
        .pipe($.cleanCss(
            {debug: true}, function(details) {
              console.log(details.name + ': ' + details.stats.originalSize);
              console.log(details.name + ': ' + details.stats.minifiedSize);
            }
        )) //压缩合并后的css文件
        .pipe($.rename(function (path) {
            path.basename += '.min'
        }))
        .pipe(gulp.dest(build.basePath))
        .pipe($.connect.reload())
        .pipe($.notify("完成：<%= file.relative %>!"))
});

gulp.task('imgmin', function () { //将img下的源文件复制到build目录下
    return gulp.src(src.imgs+'**/*.*')
        // .pipe($.imagemin())          // 压缩图片
        .pipe(gulp.dest(build.basePath))
        .pipe($.connect.reload())
        .pipe($.notify("完成：<%= file.relative %>!"))
});

// // 设置公共头尾
// gulp.task('fileInclude', function() {
//     // 适配src中所有文件夹下的所有html，排除page下的layout文件夹中html
//     gulp.src(['src/**/*.html','!src/layout/*.html'])
//         .pipe($.fileInclude({
//           prefix: '@@',
//           basepath: '@file'
//         }))
//     .pipe(gulp.dest(build.basePath));
// });

//开启一个任务（index）
gulp.task('html', function () {
    let target = gulp.src(src.html+"*.html"); //声明target保存，gulp.src源文件
    let sources = gulp.src([build.js+"*.js", build.css+"*.css"]); //声明source，gulp.src保存源资源文件
    return target.pipe($.fileInclude())     // 设置公共头尾
        .pipe($.inject(sources, {ignorePath: 'dist', addRootSlash: false})) //将资源文件注入到html文件里，需要在index.html文件里，分别指定存放css文件和js文件的位置；inject（）这两个参数，分别设置了忽略的路径，因为导出后的index.html文件需要引入css文件和js文件以便正常运行
        .pipe($.minifyHtml()) //对html文件进行压缩
        .pipe(gulp.dest(build.basePath))
        .pipe($.connect.reload()) //通知浏览器自动刷新（此方法配合视图刷新功能）
        .pipe($.notify("完成：<%= file.relative %>!"))
});

// 删除文件夹及文件
gulp.task('clean', function() {
    return gulp.src(build.basePath)
        .pipe($.clean())        // 删除文件夹及文件
        .pipe($.notify("完成：<%= file.relative %>!"))

});

//创建一个http服务，并对服务进行配置
gulp.task('serve', function () {
    $.connect.server({
        port: 8111, //指定端口号，在浏览器中输入localhost:8080就可以直接访问生成的html页面
        root: './build', //指定html文件起始的根目录
        host: '0.0.0.0',    // 可以用ip地址访问
        livereload: true,  //启动实时刷新功能（配合上边的connect.reload()方法同步使用）
        middleware: function (serve, opt) {
            return [
                proxy('/try', {
                    target: 'http://172.16.2.52:8080',
                    changeOrigin:true,
                    pathRewrite: {
                        '^/api' : '',     // 重置链接   
                    }
                }),
                proxy('/product', {
                    target: 'http://172.16.1.60:8080',
                    changeOrigin:true
                }),
                proxy('/base', {
                    target: 'http://192.168.24.77:8080',
                    changeOrigin:true
                })
            ]
        }
    });
});

//创建一个监听，用于监听源文件index.html变化之后，及时通知其进行再次gulp index编译，并实时通知浏览器端视图刷新，做到自动刷新功能
gulp.task('watch', function () {
    gulp.watch(src.css+"*.less", ['css']);
    gulp.watch(src.js+"*.js", ['js']);
    gulp.watch(src.imgs+"**/*.*", ['imgmin']);
    gulp.watch(src.html+"*.html", ['html']);

    // gulp.watch("src/**/imgs/icon/*.png", ['sprite']);
});



//default为gulp自动执行的任务，数组里注册的是，每个任务的执行（也叫default任务所依赖的任务），其中任务之间是有相互依赖关系的，所以在执行每个任务的时候用到了return，防止任务在执行的时候乱了乱了顺序（一个任务才执行一点就开始下一个任务，这样插入到最终的html文件中，得不到我们想要的结果）
gulp.task('default', runsequence(['clean'],['js', 'css','imgmin', 'html'],['serve', 'watch'])); //将任务组合起来执行


// 精灵图合并 （单独执行）
gulp.task('sprite', function() {
    gulp.src("src/**/imgs/icon/*.png")
        .pipe(spritesmith({
            imgName: 'imgs/sprite.png',     // 合并后大图的名称
            cssName: 'css/sprite.less',
            padding: 2,                     // 每个图片之间的间距，默认为0px
            cssTemplate: (data)=> {
                // data为对象，保存合成前小图和合成打大图的信息包括小图在大图之中的信息
                let arr = [],
                    width = data.spritesheet.px.width,
                    height = data.spritesheet.px.height,
                    url = data.spritesheet.image
                    // console.log("data", data)
                data.sprites.forEach(function(sprite) {
                    arr.push(
                        ".icon-" + sprite.name+
                        "{"+
                            "background: url('"+url+"') "+
                            "no-repeat "+sprite.px.offset_x+" "+sprite.px.offset_y+";"+
                            "background-size: "+ width+" "+height+";"+
                            "width: "+sprite.px.width+";"+                       
                            "height: "+sprite.px.height+";"+
                        "}\n"
                    )
                })
                return arr.join("")
            }
        }))
        .pipe(gulp.dest(src.basePath+"try/"))
})