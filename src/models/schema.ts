export const POSTS_SCHEMA_NAME = 'posts';

export const PostsSchema = {
  name: POSTS_SCHEMA_NAME,
  primaryKey: 'id',
  properties: {
    id: 'int',
    userId: 'int',
    title: 'string',
    body: 'string',
  },
};
