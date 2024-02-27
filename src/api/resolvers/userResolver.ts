import {Cat, User, UserInput} from '../../types/DBTypes';
import fetchData from '../../functions/fetchData';
import {LoginResponse, UserResponse} from '../../types/MessageTypes';
import {MyContext} from '../../types/MyContext';
import {GraphQLError} from 'graphql';

// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token. So token needs to be sent with the request to the auth server
// note2: when updating or deleting a user as admin, you need to send user id (dont delete admin btw) and also check if the user is an admin by checking the role from the user object form context

export default {
  Cat: {
    owner: async (parent: Cat) => {
      return await fetchData<User>(
        `${process.env.AUTH_URL}/users/${parent.owner}`,
      );
    },
  },
  Query: {
    users: async () => {
      return await fetchData<User[]>(`${process.env.AUTH_URL}/users`);
    },
    userById: async (_parent: undefined, args: {id: string}) => {
      return await fetchData<User>(`${process.env.AUTH_URL}/users/${args.id}`);
    },
    checkToken: async (
      _parent: undefined,
      _args: undefined,
      context: MyContext,
    ) => {
      return {user: context.userdata?.user};
    },
  },

  Mutation: {
    login: async (
      _parent: undefined,
      args: {credentials: {username: string; password: string}},
    ) => {
      return await fetchData<LoginResponse>(
        `${process.env.AUTH_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(args.credentials),
        },
      );
    },
    register: async (_parent: undefined, args: {user: UserInput}) => {
      return await fetchData<UserResponse>(`${process.env.AUTH_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args.user),
      });
    },
    updateUser: async (
      _parent: undefined,
      args: {user: UserInput},
      context: MyContext,
    ) => {
      // Check if user is logged in
      if (!context.userdata || !context.userdata.user) {
        throw new GraphQLError('Not logged in');
      }
      return await fetchData<UserResponse>(
        `${process.env.AUTH_URL}/users/${context.userdata?.user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.userdata?.token}`,
          },
          body: JSON.stringify(args.user),
        },
      );
    },
    deleteUser: async (
      _parent: undefined,
      _args: {id: string},
      context: MyContext,
    ) => {
      // Check if user is logged in
      if (!context.userdata || !context.userdata.user) {
        throw new GraphQLError('Not logged in');
      }
      return await fetchData<UserResponse>(
        `${process.env.AUTH_URL}/users/${context.userdata?.user.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.userdata?.token}`,
          },
        },
      );
    },
    updateUserAsAdmin: async (
      _parent: undefined,
      args: {user: UserInput},
      context: MyContext,
    ) => {
      // Check if user is logged in
      if (!context.userdata || !context.userdata.user) {
        throw new GraphQLError('Not logged in');
      }
      // Check if user is admin
      if (context.userdata.user.role !== 'admin') {
        throw new GraphQLError('Not an admin');
      }
      return await fetchData<UserResponse>(
        `${process.env.AUTH_URL}/users/${context.userdata?.user.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(args.user),
        },
      );
    },
    deleteUserAsAdmin: async (
      _parent: undefined,
      args: {id: string},
      context: MyContext,
    ) => {
      // Check if user is logged in
      if (!context.userdata || !context.userdata.user) {
        throw new GraphQLError('Not logged in');
      }
      // Check if user is admin
      if (context.userdata.user.role !== 'admin') {
        throw new GraphQLError('Not an admin');
      }
      return await fetchData<UserResponse>(
        `${process.env.AUTH_URL}/users/${args.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.userdata?.token}`,
          },
        },
      );
    },
  },
};
