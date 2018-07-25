let gulp = require('gulp'); //引入gulp模块
let $ = require('gulp-load-plugins')(); //引入gulp加载的所有插件（需要本地安装依赖所用到的插件）

let path = {filename:'all.js',basename:'base',extname:'js'}
//开启一个任务（js:任务名称），用于对JS文件的处理
gulp.task('js', function () {
    //加上return之后，返回一个stream（gulp.src对象），目的为了确保task在执行的时候能够按照顺序进行，并依次完成，然后注入
    return gulp.src(['./src/js/base.js', './src/js/index.js'])  //gulp.src() 指定源文件
        .pipe($.babel()) //将es6代码编译成es2015
        .pipe($.concat('all.js')) //合并js代码
        .pipe(gulp.dest('./dist/js')) //将合并后的js代码输出到build/js目录下
        .pipe($.uglify()) //进行压缩JS文件
        .pipe($.rename(function (path) { //修改压缩后的文件名称，防止覆盖上边的输出
            // {filename:'all.js',basename:'base',extname:'js'}
            path.basename += '.min'; // 在basename的基础上加上min，表示此文件为同名称文件的压缩版文件
        }))
        .pipe(gulp.dest('./dist/js')); //将压缩后的文件进行输出到指定目录
}); 
 
//开启一个任务（css:任务名称），对less文件处理，并将less文件处理后变成css文件
gulp.task('css', function () {
    return gulp.src('./src/less/*.less')
        .pipe($.less()) //将less文件编译成css文件
        .pipe($.concat('all.css')) //合并编译后的css文件，并指定名称为all.css
        .pipe(gulp.dest('./dist/css')) //输出合并后的非压缩版all.css文件
        .pipe($.cleanCss()) //压缩合并后的css文件
        .pipe($.rename(function (path) {
            path.basename += '.min'
        }))
        .pipe(gulp.dest('./dist/css'))
});

gulp.task('img', function () { //将img下的源文件复制到build目录下
    return gulp.src('./src/imgs/*').pipe(gulp.dest('./dist/imgs'))
});

//开启一个任务（index）
gulp.task('index', function () {
    let target = gulp.src('./src/*.html'); //声明target保存，gulp.src源文件
    let sources = gulp.src(['./dist/js/**/*.js', './dist/css/**/*.css']); //声明source，gulp.src保存源资源文件
    return target.pipe($.inject(sources, {ignorePath: 'dist', addRootSlash: false})) //将资源文件注入到html文件里，需要在index.html文件里，分别指定存放css文件和js文件的位置；inject（）这两个参数，分别设置了忽略的路径，因为导出后的index.html文件需要引入css文件和js文件以便正常运行
        .pipe($.minifyHtml()) //对html文件进行压缩
        .pipe(gulp.dest('./dist'))
        .pipe($.connect.reload()); //通知浏览器自动刷新（此方法配合视图刷新功能）
});

//创建一个http服务，并对服务进行配置
gulp.task('serve', function () {
    $.connect.server({
        port: 8111, //指定端口号，在浏览器中输入localhost:8080就可以直接访问生成的html页面
        root: './dist', //指定html文件起始的根目录
        host: '0.0.0.0',    // 可以用ip地址访问
        livereload: true //启动实时刷新功能（配合上边的connect.reload()方法同步使用）
    });
});

//创建一个监听，用于监听源文件index.html变化之后，及时通知其进行再次gulp index编译，并实时通知浏览器端视图刷新，做到自动刷新功能
gulp.task('watch', function () {
    gulp.watch('./src/*.html', ['index']);
});

//default为gulp自动执行的任务，数组里注册的是，每个任务的执行（也叫default任务所依赖的任务），其中任务之间是有相互依赖关系的，所以在执行每个任务的时候用到了return，防止任务在执行的时候乱了乱了顺序（一个任务才执行一点就开始下一个任务，这样插入到最终的html文件中，得不到我们想要的结果）
gulp.task('default', ['js', 'css', 'img', 'index', 'serve', 'watch']); //将任务组合起来执行

