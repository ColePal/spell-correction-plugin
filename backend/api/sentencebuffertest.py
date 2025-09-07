import unittest
from sentencebuffer import sentencebuffer


class SenetenceBufferTestCase(unittest.TestCase):
    def test_find_last_sentence_stopper_word(self):
        buffer = sentencebuffer()
        index = buffer.find_last_sentence_stopper_word("abc")
        self.assertEqual(index, -1)

    def test_find_last_sentence_stopper_word_stopper(self):
        buffer = sentencebuffer()
        index = buffer.find_last_sentence_stopper_word("abc.")
        self.assertEqual(index, 0)

    def test_find_last_sentence_stopper_word_stopper_trailer(self):
        buffer = sentencebuffer()
        index = buffer.find_last_sentence_stopper_word("abc. efg")
        self.assertEqual(index, 0)

    def test_find_last_sentence_stopper_word_two_stoppers_trailer(self):
        buffer = sentencebuffer()
        index = buffer.find_last_sentence_stopper_word("abc. efg.")
        self.assertEqual(index, 1)

    def test_find_last_sentence_stopper_word_two_stoppers_two_trailers(self):
        buffer = sentencebuffer()
        index = buffer.find_last_sentence_stopper_word("abc. efg. hello")
        self.assertEqual(index, 1)

    def test_get_trailing_text(self):
        buffer = sentencebuffer()
        text = buffer.get_trailing_text("abc")
        self.assertEqual(text, "abc")

    def test_get_trailing_text_two_words(self):
        buffer = sentencebuffer()
        text = buffer.get_trailing_text("abc efg")
        self.assertEqual(text, "abc efg")

    def test_get_trailing_text_stopper(self):
        buffer = sentencebuffer()
        text = buffer.get_trailing_text("abc. efg")
        self.assertEqual(text, "efg")


    def test_sentencebuffer_empty_add(self):

        buffer = sentencebuffer()
        buffer.update(0,"abc")
        self.assertEqual(buffer.buffer[1], "abc")
        self.assertEqual(buffer.buffer[0], 0)

    def test_sentencebuffer_filled_add(self):

        buffer = sentencebuffer()
        buffer.update(0,"abc")

        buffer.update(0, "efg")

        self.assertEqual(buffer.buffer[1], "efg")
        self.assertEqual(buffer.buffer[0], 0)

    def test_sentencebuffer_filled_update(self):
        buffer = sentencebuffer()
        buffer.update(0, "abc")

        buffer.update(0, "abefg")

        self.assertEqual(buffer.buffer[1], "abefg")
        self.assertEqual(buffer.buffer[0], 0)

    def test_sentencebuffer_filled_update_4_long_0_increment(self):
        buffer = sentencebuffer()
        buffer.update(0, "abc efg hij klm")

        buffer.update(0, "abc efg hij klm")

        self.assertEqual(buffer.buffer[1], "abc efg hij klm")
        self.assertEqual(buffer.buffer[0], 0)

    def test_sentencebuffer_filled_update_4_long_1_increment(self):
        buffer = sentencebuffer()
        buffer.update(0, "abc efg hij klm")

        buffer.update(1, "abc efg hij klm")

        self.assertEqual(buffer.buffer[1], "abc abc efg hij klm")
        self.assertEqual(buffer.buffer[0], 0)

    def test_sentencebuffer_filled_update_4_long_2_increment(self):
        buffer = sentencebuffer()
        buffer.update(0, "abc efg hij klm")

        buffer.update(2, "abc efg hij klm")

        self.assertEqual(buffer.buffer[1], "abc efg abc efg hij klm")
        self.assertEqual(buffer.buffer[0], 0)

    def test_sentencebuffer_filled_update_4_long_3_increment(self):
        buffer = sentencebuffer()
        buffer.update(0, "abc efg hij klm")

        buffer.update(3, "abc efg hij klm")

        self.assertEqual(buffer.buffer[1], "abc efg hij abc efg hij klm")
        self.assertEqual(buffer.buffer[0], 0)


    def test_sentencebuffer_filled_update_with_stop(self):
        buffer = sentencebuffer()
        buffer.update(0, "abc")
        buffer.update(0, "abce. fg")

        self.assertEqual(buffer.buffer[1], "fg")
        self.assertEqual(buffer.buffer[0], 1)

    def test_sentencebuffer_empty_add_with_stopper_at_end(self):

        buffer = sentencebuffer()
        buffer.update(0,"abc.")
        self.assertEqual(buffer.buffer[1], "")
        self.assertEqual(buffer.buffer[0], 1)

    def test_sentencebuffer_empty_add_with_wrong_index(self):
        buffer = sentencebuffer()

        buffer.update(1, "abc.")
        self.assertEqual(buffer.buffer[1], "")
        self.assertEqual(buffer.buffer[0], 2)

    def test_sentencebuffer_add_with_wrong_index(self):

        buffer = sentencebuffer()
        buffer.update(0,"abc.")

        buffer.update(3,"efg")
        self.assertEqual(buffer.buffer[1], "efg")

    def test_sentencebuffer_get_query_blank_buffer(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "abc efg hij klm")
        self.assertEqual(query, "abc efg hij klm")
        self.assertEqual(buffer.buffer[0], 0)
        self.assertEqual(buffer.buffer[1], "abc efg hij klm")

    def test_sentencebuffer_get_query_blank_buffer_stopper(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "abc efg hij klm.")
        self.assertEqual(query, "abc efg hij klm.")
        self.assertEqual(buffer.buffer[0], 4)
        self.assertEqual(buffer.buffer[1], "")

    def test_sentencebuffer_get_query_blank_buffer_stopper_mid(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "abc efg. hij klm")
        self.assertEqual(query, "abc efg. hij klm")
        self.assertEqual(buffer.buffer[0], 2)
        self.assertEqual(buffer.buffer[1], "hij klm")

    def test_sentencebuffer_get_query_blank_buffer_two_queries_stopper_mid(self):
        buffer = sentencebuffer()
        buffer.get_query(0, "abc efg. hij klm")

        query = buffer.get_query(4, "abc efg. hij klm.")
        self.assertEqual(query, "hij klm abc efg. hij klm.")
        self.assertEqual(buffer.buffer[0], 8)
        self.assertEqual(buffer.buffer[1], "")

    def test_sentencebuffer_get_query_blank_buffer_three_queries_stopper_mid(self):
        buffer = sentencebuffer()
        buffer.get_query(0, "abc efg. hij klm")
        buffer.get_query(4, "abc efg. hij klm.")
        query = buffer.get_query(7, "abc efg. hij klm")
        self.assertEqual(query, "abc efg. hij klm")
        self.assertEqual(buffer.buffer[0], 9)
        self.assertEqual(buffer.buffer[1], "hij klm")

    def test_sentencebuffer_get_query_blank_buffer_three_queries_stopper_end(self):
        buffer = sentencebuffer()
        buffer.get_query(0, "abc efg. hij klm")
        buffer.get_query(4, "abc efg. hij klm.")
        query = buffer.get_query(6, "abc efg. hij klm")
        self.assertEqual(query, "abc efg. hij klm")
        self.assertEqual(buffer.buffer[0], 8)
        self.assertEqual(buffer.buffer[1], "hij klm")

    def test_sentencebuffer_get_query_blank_buffer_four_queries_no_stopper(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "hello ther")
        self.assertEqual(query, "hello ther")
        self.assertEqual(buffer.buffer[0], 0)
        query = buffer.get_query(1, "there")
        self.assertEqual(query, "hello there")
        self.assertEqual(buffer.buffer[0], 0)
        query = buffer.get_query(1, "theremy sweet b")
        self.assertEqual(query, "hello theremy sweet b")
        self.assertEqual(buffer.buffer[0], 0)
        query = buffer.get_query(3, "bertle bus,")
        self.assertEqual(query, "hello theremy sweet bertle bus,")
        self.assertEqual(buffer.buffer[0], 0)
        query = buffer.get_query(5, "what is th")
        self.assertEqual(query, "hello theremy sweet bertle bus, what is th")
        self.assertEqual(buffer.buffer[0], 0)
        query = buffer.get_query(7, "the day like")
        self.assertEqual(query, "hello theremy sweet bertle bus, what is the day like")
        self.assertEqual(buffer.buffer[0], 0)
        query = buffer.get_query(10, "utside?")
        self.assertEqual(query, "hello theremy sweet bertle bus, what is the day like utside?")
        self.assertEqual(buffer.buffer[0], 11)

    def test_sentencebuffer_get_query_blank_buffer_four_queries_no_stopper_two(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "madame gas")
        self.assertEqual(query, "madame gas")
        query = buffer.get_query(1, "gaston, could")
        self.assertEqual(query, "madame gaston, could")
        query = buffer.get_query(3, "you beli")
        self.assertEqual(query, "madame gaston, could you beli")
        query = buffer.get_query(4, "believe it?")
        self.assertEqual(query, "madame gaston, could you believe it?")

    def test_sentencebuffer_get_query_blank_buffer_four_queries_no_stopper_two_insertions(self):
        buffer = sentencebuffer()

        query = buffer.get_query(0, "Madamme, Gastnon, Could y")
        self.assertEqual(query, "Madamme, Gastnon, Could y")
        self.assertEqual(buffer.get_text(), "Madamme, Gastnon, Could y")
        self.assertEqual(buffer.buffer[0], 0)

        query = buffer.get_query(3, "you believe it? Madamme?")
        self.assertEqual(query, "Madamme, Gastnon, Could you believe it? Madamme?")
        self.assertEqual(buffer.get_text(), "")
        self.assertEqual(buffer.buffer[0], 7)

        query = buffer.get_query(7, "Gaston? His little wife?")
        self.assertEqual(query, "Gaston? His little wife?")
        self.assertEqual(buffer.get_text(), "")
        self.assertEqual(buffer.buffer[0], 11)

        query = buffer.get_query(7, "His little wife?")
        self.assertEqual(query, "His little wife?")
        self.assertEqual(buffer.get_text(), "")
        self.assertEqual(buffer.buffer[0], 10)

        query = buffer.get_query(4, "beve it? Madamme? His little wife?")
        self.assertEqual(query, "beve it? Madamme? His little wife?")
        self.assertEqual(buffer.get_text(), "")
        self.assertEqual(buffer.buffer[0], 10)

    def test_sentencebuffer_get_query_blank_buffer_long_queries(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "Twas' brlillig, and the s")
        self.assertEqual(query, "Twas' brlillig, and the s")
        self.assertEqual(buffer.get_text(), "Twas' brlillig, and the s")
        self.assertEqual(buffer.buffer[0], 0)

        query = buffer.get_query(4, "slithy toaves did gire and")
        self.assertEqual(query, "Twas' brlillig, and the slithy toaves did gire and")
        self.assertEqual(buffer.get_text(), "Twas' brlillig, and the slithy toaves did gire and")
        self.assertEqual(buffer.buffer[0], 0)

        query = buffer.get_query(9, "gimble in the wabe. All m")
        self.assertEqual(query, "Twas' brlillig, and the slithy toaves did gire and gimble in the wabe. All m")
        self.assertEqual(buffer.get_text(), "All m")
        self.assertEqual(buffer.buffer[0], 13)

        query = buffer.get_query(14, "mimsey were the borrowgrove")
        self.assertEqual(query, "All mimsey were the borrowgrove")
        self.assertEqual(buffer.get_text(), "All mimsey were the borrowgrove")
        self.assertEqual(buffer.buffer[0], 13)

        query = buffer.get_query(17, "borrowgroves and hte mome")
        self.assertEqual(query, "All mimsey were the borrowgroves and hte mome")
        self.assertEqual(buffer.get_text(), "All mimsey were the borrowgroves and hte mome")
        self.assertEqual(buffer.buffer[0], 13)

        query = buffer.get_query(21, "raths outgrabe.")
        self.assertEqual(query, "All mimsey were the borrowgroves and hte mome raths outgrabe.")
        self.assertEqual(buffer.get_text(), "")
        self.assertEqual(buffer.buffer[0], 23)

    def test_sentencebuffer_get_query_blank_buffer_long_queries_two(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "I want this to work!")
        self.assertEqual(query, "I want this to work!")
        self.assertEqual(buffer.get_text(), "")
        self.assertEqual(buffer.buffer[0], 5)

        query = buffer.get_query(5, "And")
        self.assertEqual(query, "And")
        self.assertEqual(buffer.get_text(), "And")
        self.assertEqual(buffer.get_index(), 5)

        query = buffer.get_query(6, "I want it toi wokr well an")
        self.assertEqual(query, "And I want it toi wokr well an")
        self.assertEqual(buffer.get_text(), "And I want it toi wokr well an")
        self.assertEqual(buffer.buffer[0], 5)

        query = buffer.get_query(12, "and ai want it to fix the e")
        self.assertEqual(query, "And I want it toi wokr well and ai want it to fix the e")
        self.assertEqual(buffer.get_text(), "And I want it toi wokr well and ai want it to fix the e")
        self.assertEqual(buffer.buffer[0], 5)

        query = buffer.get_query(19, "errorws!")
        self.assertEqual(query, "And I want it toi wokr well and ai want it to fix the errorws!")
        self.assertEqual(buffer.get_text(), "")
        self.assertEqual(buffer.get_index(), 20)

    def test_sentencebuffer_get_query_deleting_sentence_start_index_0(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "twas brillig, and the slighthy.")
        self.assertEqual(buffer.get_index(), 5)
        query = buffer.get_query(5, "toaves did gire and gimble,")
        self.assertEqual(buffer.get_index(), 5)
        query = buffer.get_query(10, "in the wabe")
        self.assertEqual(buffer.get_index(), 5)
        query = buffer.get_query(0, "Hello there!")
        self.assertEqual(query, "Hello there!")
        self.assertEqual(buffer.get_index(), 2)

    def test_sentencebuffer_index_0_replace(self):
        buffer = sentencebuffer()
        query = buffer.get_query(0, "In thrnder sunghne or in rain?")
        self.assertEqual(query, "In thrnder sunghne or in rain?")
        self.assertEqual(buffer.get_index(), 6)
        query = buffer.get_query(0, "In thrnder sunghne or in rain?")
        self.assertEqual(query, "In thrnder sunghne or in rain?")
        self.assertEqual(buffer.get_index(), 6)

if __name__ == '__main__':
    unittest.main()
