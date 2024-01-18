import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type Blog = Record<{
  id: string;
  title: string;
  content: string;
  blogger: Principal;
  likes: number;
  tags: Vec<string>;
  category: string;
  comments: Vec<string>;
  updated_at: Opt<nat64>;
  created_date: nat64;
}>;

type BlogPayload = Record<{
  title: string;
  content: string;
  tags: Vec<string>;
  category: string;
}>;

const blogStorage = new StableBTreeMap<string, Blog>(0, 44, 512);

//  create a new blog
$update;
export function createBlog(payload: BlogPayload): Result<Blog, string> {
  // validate payload
  if (
    !payload.title ||
    !payload.content ||
    !payload.tags ||
    !payload.category
  ) {
    return Result.Err<Blog, string>("Invalid payload input");
  }

  try {
    // create a new blog
    const blog: Blog = {
      id: uuidv4(),
      title: payload.title,
      content: payload.content,
      blogger: ic.caller(),
      likes: 0,
      tags: payload.tags,
      category: payload.category,
      comments: [],
      updated_at: Opt.None,
      created_date: ic.time(),
    };

    blogStorage.insert(blog.id, blog);

    return Result.Ok<Blog, string>(blog);
  } catch (error) {
    return Result.Err<Blog, string>(
      "Could not create blog title: " + payload.title
    );
  }
}

// update a blog
$update;
export function updateBlog(
  id: string,
  payload: BlogPayload
): Result<Blog, string> {
  // validate payload
  if (
    !payload.title ||
    !payload.content ||
    !payload.tags ||
    !payload.category
  ) {
    return Result.Err<Blog, string>("Invalid payload input");
  }

  return match(blogStorage.get(id), {
    Some: (blog) => {
      // check if the caller is the blog owner
      if (ic.caller() !== blog.blogger) {
        return Result.Err<Blog, string>(
          "Unauthorized, only the blog owner can update the blog"
        );
      }

      // update the blog
      blog.title = payload.title;
      blog.content = payload.content;
      blog.tags = payload.tags;
      blog.category = payload.category;
      blog.updated_at = Opt.Some(ic.time());

      blogStorage.insert(blog.id, blog);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// get all blogs
$query;
export function getAllBlogs(): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  // check for blogs
  if (blogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(blogs);
}

// get blog by id
$query;
export function getBlog(id: string): Result<Blog, string> {
  const blog = blogStorage.get(id);
  return match(blog, {
    Some: (blog) => {
      return Result.Ok<Blog, string>(blog);
    },
    None: () => {
      return Result.Err<Blog, string>("Blog not found for id: " + id);
    },
  });
}

// search blogs by title and content
$query;
export function searchBlogsByTitleAndContent(
  query: string
): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(query.toLowerCase()) ||
      blog.content.toLowerCase().includes(query.toLowerCase())
  );

  // check for blogs
  if (filteredBlogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(filteredBlogs);
}

// search blogs by tags
$query;
export function searchBlogsByTags(query: string): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  const filteredBlogs = blogs.filter((blog) =>
    blog.tags.includes(query.toLowerCase())
  );

  // check for blogs
  if (filteredBlogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(filteredBlogs);
}

// search blogs by category
$query;
export function searchBlogsByCategory(
  query: string
): Result<Vec<Blog>, string> {
  const blogs = blogStorage.values();
  const filteredBlogs = blogs.filter((blog) =>
    blog.category.toLowerCase().includes(query.toLowerCase())
  );

  // check for blogs
  if (filteredBlogs.length === 0) {
    return Result.Err<Vec<Blog>, string>(
      "No blogs found, please add them first"
    );
  }
  return Result.Ok<Vec<Blog>, string>(filteredBlogs);
}

// like a blog
$update;
export function likeBlog(id: string): Result<Blog, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // check if the caller is the blog owner
      if (ic.caller() === blog.blogger) {
        return Result.Err<Blog, string>(
          "not allowed, you cannot like your own blog"
        );
      }

      // update the blog
      blog.likes += 1;

      blogStorage.insert(blog.id, blog);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// comment on a blog
$update;
export function commentBlog(id: string, comment: string): Result<Blog, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // update the blog
      blog.comments.push(comment);

      blogStorage.insert(blog.id, blog);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// get comments on a blog
$query;
export function getBlogComments(id: string): Result<Vec<string>, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // check if blog has comments
      if (blog.comments.length === 0) {
        return Result.Err<Vec<string>, string>(
          "No comments found for blog id: " + id
        );
      }

      return Result.Ok<Vec<string>, string>(blog.comments);
    },
    None: () => Result.Err<Vec<string>, string>("Blog not found for id: " + id),
  });
}

// delete a blog
$update;
export function deleteBlog(id: string): Result<Blog, string> {
  return match(blogStorage.get(id), {
    Some: (blog) => {
      // check if the caller is the blog owner
      if (ic.caller() !== blog.blogger) {
        return Result.Err<Blog, string>(
          "Unauthorized, only the blog owner can delete the blog"
        );
      }

      // delete the blog
      blogStorage.remove(id);

      return Result.Ok<Blog, string>(blog);
    },
    None: () => Result.Err<Blog, string>("Blog not found for id: " + id),
  });
}

// UUID workaround
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};
