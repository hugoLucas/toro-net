from faker import Faker

import requests
import random
import json


BASE = "https://randomapi.com/api/"
REF_ID = "gshexzje"
KEY = "O38S-58YS-9YK7-AK1D"
FMT = "prettyjson"


"""
MATCH (p1:User), (p2:User)
WITH p1, p2
WHERE rand() < 0.1 and p1 <> p2
MERGE (p1)-[:friend]-(p2)
"""


def get_random_user(num_users=1):
    """
    Uses the random API to generate a random toro-net user. Using free-tier of API so num_users can be at most 10.
    :param num_users: the number of users to generate
    :return: a list of json objects containing the user information
    """
    if num_users > 10 or num_users < 1:
        raise ValueError("Parameter num_users is should be in range [1, 10]")

    url = BASE + REF_ID + "?key=" + KEY + "&fmt=" + FMT + "&results=" + str(num_users)
    req = requests.get(url)

    if req.status_code == 200:
        json_data = json.loads(req.text)
        return json_data["results"]
    else:
        raise ConnectionError("API returned status code: {}".format(req.status_code))


def get_random_user_cluster(num_clusters=1):
    """
    Calls the RandomAPI multiple times in order to create friend trees containing more than 10 users.
    :param num_clusters: the number of users clusters, which each contain 10 users, to create
    :return: a list of the new users to create
    """
    print("Starting to generate users...")
    new_users = []
    for i in range(0, num_clusters):
        new_users.extend(get_random_user(num_users=10))
    return new_users


def add_users(url, user_list):
    """
    Iterates through the list of users provided and calls the url given to add the user using the appropriate
    toro-net API endpoint.
    :param url: the url route for the add user endpoint
    :param user_list: a list of encoded user objects
    :return: None
    """
    print("Starting to add users...")
    for usr in user_list:
        print(usr['email'], usr['password'])
        post_req = requests.post(url, data={
            'displayName': usr['displayName'],
            'email': usr['email'],
            'username': usr['username'],
            'password': usr['password']
        })
        print("User: email -> {} password -> {}".format(usr['email'], usr['password']))
        if post_req.status_code != 200:
            print("Failed to add user: {}".format(usr['displayName']))


def create_friendships(url, user_list, friend_prob=0.50):
    """
    Creates friendships between NEWLY created users. Will add functionality to add friendships between existing users
    in the future.

    :param friend_prob: the probability that any two users will be friends [0.0, 1.0)
    :param url: the url route for the add friend endpoint
    :param user_list: a list of encoded user objects
    :return: None
    """
    print("Adding friendships...")
    friendship_pairs = gen_friendships(user_list, friend_prob)
    for friendship in friendship_pairs:
        f1, f2 = user_list[friendship[0]], user_list[friendship[1]]
        post_req = requests.post(url, data={
            'sUsername': f1['username'],
            'tUsername': f2['username'],
        })
        if post_req.status_code != 200:
            print("Friendship {} <-> {} failed.".format(f1['username'], f2['username']))


def gen_friendships(user_list, friend_prob=0.50):
    """
    Creates a list of indices from the input list that represent friendships between the users in those
    indices.

    :param user_list: a list of encoded user objects
    :param friend_prob: the probability that any two users will be friends [0.0, 1.0)
    :return: a list of tuples
    """
    friend_pairs = []
    for i1 in range(0, len(user_list)):
        for i2 in range(i1 + 1, len(user_list)):
            if random.random() <= friend_prob:
                friend_pairs.append([i1, i2])
    return friend_pairs


def fetch_friends(url, username, degree):
    """
    Returns a list of friends for a given email.

    :param url: the url for the get friends API endpoint
    :param username: the user name of the user for which we want the list of friends
    :param degree: how deep the friend search will be (ex. 1 = friends, 2 = friends of friends)
    :return: a list of friends
    """
    endpoint_url = url + '/{}/{}'.format(username, degree)
    get_req = requests.get(endpoint_url)

    if get_req.status_code == 200:
        # Success
        print(get_req.text)
    else:
        # Failure
        print(get_req.text)
        print(get_req.status_code)


def generate_posts(url, new_users):
    """
    Given a list of recently created users, this function takes each user and creates three to five
    posts for each user.

    :param url: the url for the add posts API endpoint
    :param new_users: a list of recently
    :return: None
    """
    print('Creating posts...')
    fake_obj = Faker()
    for usr in new_users:
        number_of_posts = random.randint(3, 5)
        for _ in range(0, number_of_posts):
            post_req = requests.post(url, data={
                'username': usr['username'],
                'title': fake_obj.address(),
                'body': fake_obj.text()
            })
            if post_req.status_code != 200:
                print("Post failed")
    print('Posts created!')

new_users = get_random_user_cluster(num_clusters=1)
add_users(url='http://localhost:3000/users/register', user_list=new_users)
create_friendships(url='http://localhost:3000/users/add/friend', user_list=new_users, friend_prob=0.10)
generate_posts(url="http://localhost:3000/posts/create/api", new_users=new_users)
