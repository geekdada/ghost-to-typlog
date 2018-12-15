'use strict';

const Command = require('common-bin');
const chalk = require('chalk');
const moment = require('moment');
const ora = require('ora');
const _ = require('lodash');
const fs = require('fs-extra');

module.exports = class ConvertCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);

    this.tagMap = new Map();
    this.tagRelationMap = new Map();
    this.options = {
      input: {
        type: 'string',
        alias: 'i',
        description: 'Ghost backup file(json) path',
        demandOption: true,
      },
      output: {
        type: 'string',
        alias: 'o',
        description: 'output file path',
        default: `ghost-export-to-typlog-${moment().format('YYYY-MM-DD')}.json`,
      },
    };
  }

  async run({ argv }) {
    const { input, output: outputFile } = argv;
    const backup = require(input);
    const db = backup.db[0];
    const { posts, posts_tags, tags } = db.data;
    const output = {
      posts: [],
    };


    this.spinner = ora('Converting posts');
    this.log(chalk.cyan('This backup file was created at'), moment(db.meta.exported_on).format());
    this.spinner.start();

    tags.forEach(tag => {
      this.tagMap.set(tag.id, tag.name);
    });

    posts_tags.forEach(({ post_id, tag_id }) => {
      let tagList = [];

      if (this.tagRelationMap.has(post_id)) {
        tagList = this.tagRelationMap.get(post_id);
      }

      tagList.push(this.tagMap.get(tag_id));

      this.tagRelationMap.set(post_id, tagList);
    });

    posts.forEach(post => {
      if (post.page) {
        return;
      }

      this.spinner.text = `Converting ${post.title}`;
      output.posts.push(this.converPost(post));
      this.spinner.succeed(`${post.title}`);
    });

    this.spinner.succeed('Successful!');

    await fs.writeJSON(outputFile, output);

    this.cleanUp();
  }

  cleanUp() {
    this.spinner = null;
  }

  log(...args) {
    console.log(...args);
  }

  converPost(originalPost) {
    const { id, title, slug, custom_excerpt, mobiledoc, created_at, published_at, status, visibility } = originalPost;
    const meta = JSON.parse(mobiledoc);
    const markdown = _.get(meta, 'cards[0][1].markdown');

    if (!markdown) {
      throw new Error('Not a markdown post');
    }

    return {
      title,
      slug: slug || '',
      headline: custom_excerpt || '',
      content: markdown,
      status: status || 'published',
      visibility: visibility || 'public',
      tags: this.tagRelationMap.get(id),
      created_at: moment(created_at).format('YYYY-MM-DDThh:mm:ss') + 'Z',
      published_at: moment(published_at).format('YYYY-MM-DDThh:mm:ss') + 'Z',
    };
  }
};

