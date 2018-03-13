const fs = require('fs')
const superagent = require('superagent');
const cheerio = require('cheerio');
const _ = require('lodash');

const reptileUrl = "http://www.jianshu.com/";

let [homeResult, detailResult, curTime] = [[], [], new Date().getTime()]

function getHomepage () {
  superagent.get(reptileUrl).end(function (err, res) {
      // 抛错拦截
      if(err){
          return err;
      }
      // 等待 code
      const $ = cheerio.load(res.text)
      $('#list-container .note-list li').each(function(i, elem) {
        // 拿到当前li标签下所有的内容，开始干活了
        homeResult.push({
          id: $(elem).attr('data-note-id'),
          slug: $(elem).find('.title').attr('href').replace(/\/p\//, ''),
          title: $(elem).find('.title').text(),
          abstract: $(elem).find('.abstract').text(),
          thumbnails: $(elem).find('.wrap-img img').attr('src'),
          collection_tag: $(elem).find('.collection-tag').text(),
          reads_count: $(elem).find('.ic-list-read').parent().text().replace(/\s+/g, ''),
          comments_count: $(elem).find('.ic-list-comments').parent().text().replace(/\s+/g, ''),
          like_count: $(elem).find('.ic-list-like').parent().text().replace(/\s+/g, ''),
          money_count: $(elem).find('.ic-list-money').parent().text().replace(/\s+/g, ''),
          avatr: $(elem).find('.avatar img').attr('src'),
          nickname: $(elem).find('.nickname').text(),
          time: $(elem).find('.time').attr('data-shared-at'),
        })
      });
      // 写json文件一定要JSON.stringify()处理，不然就是[object Object]这货了。
      fs.writeFile(`${__dirname}/data/homePage/crawLog-${curTime}.json`, JSON.stringify({
        time: new Date().getTime(),
        data: homeResult
      }), 
      (err) => {
        if (err) {
          throw err;
        }
        console.log('写入完成！现在开始爬取每条记录的详情页')
        // getDetails(curTime, homeResult)
      })
  });
}

function getDetails (curTime, arr) {
  // 异步
  _.each(arr, (item, index) => {
    superagent.get(`${reptileUrl}p/${item.slug}/`).end((err, res) => {
      if (err) {
        throw err
      }
      let $ = cheerio.load(res.text)
      let note = JSON.parse($('script[data-name=page-data]')[0].children[0].data);
      detailResult.push({
        article: {
          id: note.note.id,
          slug: note.note.slug,
          title: $('div.post').find('.article .title').text(),
          content: $('div.post').find('.article .show-content').html(),
          publishTime: $('div.post').find('.article .publish-time').text(),
          wordage: $('div.post').find('.article .wordage').text(),
          views_count: note.note.views_count,
          comments_count: note.note.comments_count,
          like_count: note.note.like_count
        },
        author: {
          id: note.note.user_id,
          slug: $('div.post').find('.avatar').attr('href').replace(/\/u\//, ""),
          avatar: $('div.post').find('.avatar img').attr('src'),
          nickname: $('div.post').find('.author .name a').text(),
          signature: $('div.post').find('.signature').text(),
          total_wordage: note.note.author.total_wordage,
          followers_count: note.note.author.followers_count,
          total_likes_count: note.note.author.total_likes_count
        }
      })
      // 先读再写
      fs.exists(`${__dirname}/data/details/details-${curTime}.json`, (exists) => {
        if (exists) {
          // 有文件先读取旧数据
          fs.readFile(`${__dirname}/data/details/details-${curTime}.json`, 'utf-8', (err, data) => {
            if (err) {
              throw err
            } else {
              // detailResult是最新的数组，这里是不停覆盖该文件，保持最新
              fs.writeFile(`${__dirname}/data/details/details-${curTime}.json`, JSON.stringify({
                status: 0,
                data: detailResult
              }), (err) => {
                if (err) {
                  throw err
                }
              })
            }
          })
        } else {
          // 无文件则写数据
          fs.writeFile(`${__dirname}/data/details/details-${curTime}.json`, JSON.stringify({
            status: 0,
            data: detailResult // 数组
          }), (err) => {
            if (err) {
              throw err
            }
          })
        }
      })
    })
  })
  console.log('爬取详情页成功！')
}

getHomepage()